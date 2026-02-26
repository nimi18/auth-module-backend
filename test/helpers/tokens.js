function extractJwt(resBody) {
  return resBody && resBody.token ? resBody.token : null;
}

module.exports = { extractJwt };