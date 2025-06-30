import { getModelForClass, prop, Ref } from '@typegoose/typegoose';

class Address {
  @prop({ required: true })
  public street!: string;

  @prop({ required: true })
  public city!: string;

  @prop({ required: true })
  public state!: string;

  @prop({ required: true })
  public zip!: string;
}

export class User {
  @prop({ required: true, unique: true })
  public email!: string;

  @prop()
  public firstName?: string;

  @prop()
  public lastName?: string;

  @prop()
  public address?: Address;

  @prop({ ref: () => Post })
  public posts: Ref<Post>[];
}

class Post {
  @prop({ required: true, unique: true })
  public slug!: string;

  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public body!: string;

  @prop({ ref: () => User, required: true })
  public author: Ref<User>;

  @prop({ ref: () => Comment })
  public comments: Ref<Comment>[];
}

class Comment {
  @prop({ required: true })
  public comment!: string;

  @prop({ ref: () => Post, required: true })
  public post: Ref<Post>;
}

export const AddressModel = getModelForClass(Address);
export const UserModel = getModelForClass(User);
export const PostModel = getModelForClass(Post);
export const CommentModel = getModelForClass(Comment);
