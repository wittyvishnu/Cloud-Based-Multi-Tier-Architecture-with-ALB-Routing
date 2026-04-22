exports.getFeed = async (req, res) => {
  return res.json({ api: 'getFeed' });
};

exports.getFollowedFeed = async (req, res) => {
  return res.json({ api: 'getFollowedFeed' });
};
