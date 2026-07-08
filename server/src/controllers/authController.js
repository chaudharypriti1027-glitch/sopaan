import * as authService from '../services/authService.js';

export async function signup(req, res) {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  res.status(200).json(result);
}

export async function setPassword(req, res) {
  const result = await authService.setPassword(req.user._id, req.body.password);
  res.status(200).json(result);
}

export async function refresh(req, res) {
  const result = await authService.refreshAccessToken(req.body.refreshToken);
  res.status(200).json(result);
}

export async function requestOtp(req, res) {
  const result = await authService.requestOtp(req.body);
  res.status(200).json(result);
}

export async function verifyOtp(req, res) {
  const result = await authService.verifyOtp(req.body);
  res.status(200).json(result);
}

/** @deprecated legacy path — includes { message } and session-shaped verify response. */
export async function requestOtpLegacy(req, res) {
  const result = await authService.requestOtp(req.body);
  res.status(200).json({ ...result, message: 'OTP sent successfully' });
}

/** @deprecated legacy path — maps AuthResult to accessToken/user session. */
export async function verifyOtpLegacy(req, res) {
  const result = await authService.verifyOtp(req.body);
  res.status(200).json(authService.toLegacyAuthSession(result));
}

export async function logout(req, res) {
  const result = await authService.logout({
    refreshToken: req.body.refreshToken,
    userId: req.user?._id,
  });
  res.status(200).json(result);
}

export async function googleAuth(req, res) {
  const result = await authService.loginWithGoogle(req.body);
  res.status(200).json(result);
}

export async function getTeamInvite(req, res) {
  const { getTeamInviteByToken } = await import('../services/admin/teamService.js');
  res.status(200).json(await getTeamInviteByToken(req.params.token));
}
