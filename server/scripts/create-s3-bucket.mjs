#!/usr/bin/env node
/**
 * Create the S3 bucket named in server/.env (if it does not exist).
 * Usage: npm run create:s3
 */
import 'dotenv/config';

const bucket = process.env.S3_BUCKET?.trim();
const region = process.env.S3_REGION?.trim() || 'us-east-1';
const accessKey = process.env.S3_ACCESS_KEY?.trim();
const secretKey = process.env.S3_SECRET_KEY?.trim();

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

if (!bucket) fail('Set S3_BUCKET in server/.env');
if (!accessKey || !secretKey) fail('Set S3_ACCESS_KEY and S3_SECRET_KEY in server/.env');

const { S3Client, CreateBucketCommand, HeadBucketCommand } = await import('@aws-sdk/client-s3');

const client = new S3Client({
  region,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
});

try {
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log(`Bucket "${bucket}" already exists. Run: npm run check:s3`);
  process.exit(0);
} catch (error) {
  const missing = error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404;
  if (!missing) {
    fail(`${error?.name || 'Error'}: ${error?.message || error}`);
  }
}

const input = { Bucket: bucket };
if (region !== 'us-east-1') {
  input.CreateBucketConfiguration = { LocationConstraint: region };
}

try {
  await client.send(new CreateBucketCommand(input));
  console.log(`Created bucket "${bucket}" in region ${region}`);
  console.log('Next: npm run check:s3');
} catch (error) {
  if (error?.name === 'BucketAlreadyExists') {
    fail(
      `Bucket name "${bucket}" is taken globally. Pick a unique name, e.g. sopaan-media-384344321477, update S3_BUCKET in .env`,
    );
  }
  if (error?.name === 'AccessDenied') {
    fail('IAM user needs s3:CreateBucket permission, or create the bucket manually in AWS Console → S3');
  }
  fail(`${error?.name || 'Error'}: ${error?.message || error}`);
}
