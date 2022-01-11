import { prop, pre, getModelForClass, ReturnModelType, plugin, Ref, DocumentType } from '@typegoose/typegoose';
import paginate from 'mongoose-paginate-v2';

// You User Model definition here
@pre<User>('save', function() {
  this.updatedAt = new Date();
  this.enable = this.loginAttemp < parseInt(process.env['MAX_LOGIN_ATTEMPS']);
})

@plugin(paginate)
export class User {

  @prop({ required: true })
  public name!: string;

  @prop()
  public dob?: Date;

  @prop()
  public role?: string;

  @prop({ required: true, unique: true, index: true })
  public email!: string; 

  @prop({ required: true })
  public password!: string;

  @prop()
  public createdAt?: Date;

  @prop()
  public updatedAt?: Date;

  @prop({ default: 0 })
  public loginAttemp?: number;

  @prop({ default: true })
  public enable?: boolean;
  
  @prop()
  public passwordResetTokenExpires?: Date;

  @prop()
  public passwordResetToken?: string;


  public static async add(this: ReturnModelType<typeof User>, user: User) {
    const newUser = new UserModel(user);
    newUser.createdAt = new Date();
    return newUser.save();
  }

  public static async getUsers(this: ReturnModelType<typeof User>, page?: number, limit?: number, query?: any) {
    return this.find(query);
  }

  public static async updateUser(this: ReturnModelType<typeof User>, userId: string, data: any) {
    return this.findByIdAndUpdate(userId, data);
  }

  public static async getById(this: ReturnModelType<typeof User>, userId: string, exist?: boolean) {
    return this.findById(userId);
  }

  public static async getByEmail(this: ReturnModelType<typeof User>, email: string, exist?: boolean) {
    return this.findOne({ email : email });
  }

  public static async deleteById(this: ReturnModelType<typeof User>, userId: string) {
    return this.deleteOne({_id: userId});
  }

}

const DefaultTransform = {
  schemaOptions: {
    collection: 'users',
    toJSON: {
      virtuals: true,
      getters: true,
      // versionKey: false,
      transform: (doc, ret, options) => {
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      getters: true,
      transform: (doc, ret, options) => {
        delete ret._id;
        return ret;
      },
    },
  },
};

export const UserModel = getModelForClass(User, DefaultTransform);
