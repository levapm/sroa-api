import createError from 'http-errors';
import { User, UserModel } from '../models/user';
import { ClientInfo, RefreshTokenModel } from '../models/refresh-token';
import { comparePasswords, hashPassword } from '../helpers/hash.helper';
import jwt from 'jsonwebtoken';
import uuid from 'uuid';
import { addMinutes } from 'date-fns';

const createToken = (user: any) => {
  return jwt.sign(user, process.env['JWT_SECRET'], {
    expiresIn: process.env['TOKEN_EXPIRES_IN'],
  });
};

const createRefreshToken = async (userId, clientInfo) => {
  const refreshToken = uuid.v4();
  const expiresIn = addMinutes( new Date(), parseInt(process.env['REFRESH_TOKEN_EXPIRES_IN']));
  await RefreshTokenModel.add(refreshToken, expiresIn, userId, clientInfo);
  return refreshToken;
}

export const login = async (
  email: string,
  password: string,
  clientInfo: ClientInfo
) => {
  try {
    const existingUser = await UserModel.getByEmail(email);
    if (!existingUser) {
      throw createError(403, 'There was a problem. User does not exist');
    }

    if (!existingUser.enable) {
      throw createError(403, 'There was a problem. User disabled please reset your password');
    }

    if (!comparePasswords(password, existingUser.password)) {
      existingUser.set({loginAttemp: existingUser.loginAttemp + 1}).save();
      throw createError(403, 'There was a problem. Invalid Credentials');
    }
    
    existingUser.set({loginAttemp: 0}).save();
    const token = createToken({ id: existingUser._id});
    const refreshToken = await createRefreshToken(existingUser._id, clientInfo);
    return { token: token, refreshToken: refreshToken};
  } catch (error) {
    throw error;
  }
};

export const refreshToken = async (refreshToken: string) => {
  try {
    const existToken = await RefreshTokenModel.getByToken(refreshToken);
    if (!existToken || existToken.expiresIn <= new Date()) {
      throw createError(403, 'There was a problem. Invalid Token or Token Expired');
    }
    const existingUser = await UserModel.getById(existToken.userId);
    return { token: createToken({ id: existingUser._id}) };
  } catch (error) {
    throw error;
  }

};

export const validateToken = async (token: string) => {
  try {
    const user = jwt.verify(token, process.env['JWT_SECRET']);
    const existingUser = await UserModel.getById(user['id']);
    if (!existingUser) {
      throw createError(403, 'There was a problem. User does not exist for this token');
    }
    return { token: token, userId: existingUser._id };
  } catch (error) {
    throw error;
  }

};

export const register = async (user: User) => {
  try {
    const existingUser = await UserModel.getByEmail(user.email);
    if (existingUser) {
      return { exists: true };
    }
    user.password = hashPassword(user.password);
    const newUser = await UserModel.add(user);
    if (!newUser) {
      throw createError(403, 'There was a problem.');
    }
    return { userId: newUser._id };
  } catch (error) {
    throw error;
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const existingUser = await UserModel.getByEmail(email);
    if (!existingUser) {
      throw createError(403, 'There was a problem. User does not exist');
    }
    const now = new Date();
    const passwordResetTokenExpires = addMinutes(now, 10);
    const passwordResetToken = uuid.v4();
    await existingUser.updateOne({
      passwordResetTokenExpires,
      passwordResetToken,
      updatedAt: now,
    });
    console.log('reset token:', passwordResetToken);
    console.log('reset token:', email);

    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email: string, password: string, token: string) => {
  try {
    const user = await UserModel.getByEmail(email, false);
    if (!user) {
      throw createError(403, 'There was a problem reseting your password. User does not exist');
    }
    if (user.passwordResetToken !== token) {
      throw createError(403, 'There was a problem reseting your password. Invalid Token');
    }
    if (user.passwordResetTokenExpires < new Date()) {
      throw createError(403, 'There was a problem reseting your password. Token expired');
    }
    const hashedPassword = hashPassword(password);
    await user.updateOne({ password: hashedPassword });
    return { success: true };
  } catch (error) {
    throw error;
  }
};
