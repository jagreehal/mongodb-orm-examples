import bcrypt from 'bcryptjs';
import { Document, model, Schema } from 'mongoose';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  body: string;
  author: User;
  comments: Comment[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface User {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address?: Address;
  posts: Post[];
}

export interface Comment {
  comment: string;
  post: Post;
}

export interface UserDocument extends User, Document {
  fullName(): string;
  isValidPassword(password: string): Promise<boolean>;
}

export function transform(document: Document, returnValue) {
  returnValue.id = returnValue._id.toString();
  delete returnValue._id;
  delete returnValue.__v;
  return returnValue;
}

export const addressSchema = new Schema<Address>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
  },
  {
    _id: false,
    toJSON: {
      transform,
    },
  },
);

export const userSchema: Schema<User> = new Schema<User>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: addressSchema,
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  },
  {
    timestamps: true,
    toJSON: {
      transform,
    },
    methods: {
      fullName(): string {
        return `${this.firstName} ${this.lastName}`;
      },
      isValidPassword: async function (password: string): Promise<boolean> {
        return comparePassword(password, this.password);
      },
    },
  },
);

userSchema.pre('save', async function (next) {
  const hashedPassword = await hashPassword(this.password);
  this.password = hashedPassword;
  next();
});

const postSchema = new Schema<Post>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  },
  {
    toJSON: {
      transform,
    },
  },
);

const commentSchema = new Schema<Comment>({
  comment: { type: String, required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
});

export const UserModel = model<UserDocument>(
  'User',
  userSchema as Schema<UserDocument>,
);
export const PostModel = model<Post>('Post', postSchema);
export const Comment = model<Comment>('Comment', commentSchema);
