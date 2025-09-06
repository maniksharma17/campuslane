import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

export const verifyGoogleToken = async (idToken: string): Promise<GoogleTokenPayload> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    return {
      sub: payload.sub,
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture,
      email_verified: payload.email_verified || false,
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
};