import { buildHomeFeed, bustHomeFeedCache } from '../services/home/buildHomeFeed.js';

function toLeanUser(user) {
  return typeof user?.toObject === 'function' ? user.toObject() : user;
}

function applyFeedHttpHeaders(req, res, feed) {
  const etag = `"${feed.generatedAt}"`;
  res.set('ETag', etag);
  res.set('Last-Modified', new Date(feed.generatedAt).toUTCString());

  const ifNoneMatch = req.headers['if-none-match'];

  if (ifNoneMatch && ifNoneMatch === etag) {
    return true;
  }

  return false;
}

export async function getHome(req, res) {
  const user = toLeanUser(req.user);
  const feed = await buildHomeFeed(user);

  if (applyFeedHttpHeaders(req, res, feed)) {
    return res.status(304).end();
  }

  return res.status(200).json(feed);
}

export async function refreshHome(req, res) {
  await bustHomeFeedCache(req.user._id);

  const user = toLeanUser(req.user);
  const feed = await buildHomeFeed(user, { skipCache: true });

  applyFeedHttpHeaders(req, res, feed);
  return res.status(200).json(feed);
}
