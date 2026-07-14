#!/usr/bin/env node
/**
 * Verify S3 / object-storage credentials from server/.env.
 * Usage: node scripts/check-s3.mjs
 */
import 'dotenv/config';

const bucket = process.env.S3_BUCKET?.trim();
const region = process.env.S3_REGION?.trim() || 'us-east-1';
const accessKey = process.env.S3_ACCESS_KEY?.trim();
const secretKey = process.env.S3_SECRET_KEY?.trim();
const sessionToken = process.env.S3_SESSION_TOKEN?.trim() || process.env.AWS_SESSION_TOKEN?.trim();
const endpoint = process.env.S3_ENDPOINT?.trim();

function fail(message, hints = []) {
  console.error(`FAIL: ${message}`);
  for (const hint of hints) {
    console.error(`  → ${hint}`);
  }
  process.exit(1);
}

if (!bucket) fail('S3_BUCKET is missing');
if (!accessKey) fail('S3_ACCESS_KEY is missing');
if (!secretKey) fail('S3_SECRET_KEY is missing');

const isTemporaryKey = accessKey.startsWith('ASIA');
if (isTemporaryKey && !sessionToken) {
  fail('Temporary AWS key (ASIA*) requires S3_SESSION_TOKEN or AWS_SESSION_TOKEN');
}

const credentials = {
  accessKeyId: accessKey,
  secretAccessKey: secretKey,
};

if (sessionToken) {
  credentials.sessionToken = sessionToken;
}

function buildClient(targetRegion) {
  const config = {
    region: targetRegion || region || 'us-east-1',
    credentials,
  };

  if (endpoint) {
    config.endpoint = endpoint;
    config.forcePathStyle = true;
  }

  return config;
}

function describeAwsError(error) {
  const code = error?.name || error?.Code || 'Error';
  const status = error?.$metadata?.httpStatusCode;
  const bucketRegion = error?.BucketRegion || error?.$response?.headers?.['x-amz-bucket-region'];
  return { code, status, bucketRegion, message: error?.message || String(error) };
}

try {
  const {
    S3Client,
    HeadBucketCommand,
    GetBucketLocationCommand,
    ListBucketsCommand,
    PutObjectCommand,
    DeleteObjectCommand,
  } = await import('@aws-sdk/client-s3');

  const client = new S3Client(buildClient(region));
  const probeKey = `health-check/${Date.now()}-probe.txt`;

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (headError) {
    const { code, status, bucketRegion, message } = describeAwsError(headError);

    if (code === 'InvalidAccessKeyId' || code === 'SignatureDoesNotMatch') {
      fail(`${code}: ${message}`, [
        'Check S3_ACCESS_KEY and S3_SECRET_KEY in server/.env',
        'Create a new access key in IAM if the secret was lost',
      ]);
    }

    if (code === 'Forbidden' || code === 'AccessDenied' || status === 403) {
      fail(`${code}: ${message}`, [
        `IAM user needs s3:ListBucket and s3:HeadBucket on arn:aws:s3:::${bucket}`,
        'Attach an inline S3 policy to user sopan (see server/.env.example)',
      ]);
    }

    if (bucketRegion && bucketRegion !== region) {
      fail(`Bucket "${bucket}" exists in ${bucketRegion}, but S3_REGION=${region}`, [
        `Set S3_REGION=${bucketRegion} in server/.env`,
        `Set S3_PUBLIC_BASE_URL=https://${bucket}.s3.${bucketRegion}.amazonaws.com`,
      ]);
    }

    if (code === 'NotFound' || status === 404) {
      let listed = '';
      try {
        const listClient = new S3Client(buildClient('us-east-1'));
        const list = await listClient.send(new ListBucketsCommand({}));
        const names = (list.Buckets ?? []).map((entry) => entry.Name).filter(Boolean);
        if (names.length > 0) {
          listed = names.join(', ');
        }
      } catch {
        // ListBuckets may be denied; ignore.
      }

      fail(`Bucket "${bucket}" was not found (region ${region})`, [
        'Create the bucket in AWS Console → S3 → Create bucket',
        `Use exact name "${bucket}" and region "${region}"`,
        'Or update S3_BUCKET in server/.env to match your existing bucket name',
        ...(listed ? [`Buckets visible to this IAM user: ${listed}`] : []),
      ]);
    }

    fail(`${code}: ${message}`, [
      `Bucket: ${bucket}`,
      `Region: ${region}`,
    ]);
  }

  // Confirm bucket region when HeadBucket succeeds.
  try {
    const location = await client.send(new GetBucketLocationCommand({ Bucket: bucket }));
    const actualRegion = location.LocationConstraint || 'us-east-1';
    if (actualRegion !== region) {
      fail(`Bucket region mismatch: bucket is in ${actualRegion}, S3_REGION=${region}`, [
        `Set S3_REGION=${actualRegion}`,
      ]);
    }
  } catch {
    // Optional diagnostic only.
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: probeKey,
      Body: 'sopaan-s3-check',
      ContentType: 'text/plain',
    }),
  );

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: probeKey,
    }),
  );

  console.log('OK: S3 credentials work');
  console.log(`  bucket: ${bucket}`);
  console.log(`  region: ${region}`);
  console.log(`  endpoint: ${endpoint || '(aws default)'}`);
  console.log(`  key: ${accessKey.slice(0, 8)}…`);
} catch (error) {
  const { code, message } = describeAwsError(error);

  if (code === 'AccessDenied' || code === 'Forbidden') {
    fail(`${code}: ${message}`, [
      `Add s3:PutObject and s3:DeleteObject on arn:aws:s3:::${bucket}/*`,
    ]);
  }

  fail(`${code}: ${message}`);
}
