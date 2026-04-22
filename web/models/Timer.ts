// import mongoose, { Document, Schema } from 'mongoose';

// export interface ITimer extends Document {
//   shop: string;
//   name: string;
//   type: 'fixed' | 'evergreen';
//   startDate?: Date;
//   endDate?: Date;
//   targetType: 'all' | 'products' | 'collections';
//   targetIds: string[];
//   targetDetails?: { id: string; title: string; image: string }[];
//   design: {
//     backgroundColor: string;
//     textColor: string;
//     position: string;
//     text: string;
//   };
//   impressions: number;
//   status: 'active' | 'paused' | 'expired';
// }

// const timerSchema = new Schema<ITimer>(
//   {
//     shop: { type: String, required: true, index: true },
//     name: { type: String, required: true },
//     type: { type: String, enum: ['fixed', 'evergreen'], required: true },
//     startDate: { type: Date },
//     endDate: { type: Date },
//     targetType: { type: String, enum: ['all', 'products', 'collections'], required: true },
//     targetIds: [{ type: String }],
//     targetDetails: [{
//       id: String,
//       title: String,
//       image: String
//     }],
//     design: {
//       backgroundColor: { type: String, default: '#000000' },
//       textColor: { type: String, default: '#FFFFFF' },
//       position: { type: String, default: 'top' },
//       text: { type: String, default: 'Offer ends in:' },
//     },
//     impressions: { type: Number, default: 0 },
//     status: { type: String, enum: ['active', 'paused', 'expired'], default: 'active' },
//   },
//   { timestamps: true }
// );

// export const Timer = mongoose.model<ITimer>('Timer', timerSchema);


import mongoose, { Document, Schema } from 'mongoose';

export interface ITimer extends Document {
  shop: string;
  name: string;
  type: 'fixed' | 'evergreen';
  startDate?: Date;
  endDate?: Date;
  evergreenDuration?: number; // hours, default 24
  targetType: 'all' | 'products' | 'collections';
  targetIds: string[];
  targetDetails?: { id: string; title: string; image: string }[];
  design: {
    backgroundColor: string;
    textColor: string;
    urgencyColor: string;      // color when < threshold
    position: string;
    text: string;
    size: 'small' | 'medium' | 'large';
    urgencyType: 'color_pulse' | 'color_change' | 'none';
    urgencyThresholdMinutes: number; // minutes before end to trigger urgency
  };
  impressions: number;
  status: 'active' | 'paused' | 'expired';
}

const timerSchema = new Schema<ITimer>(
  {
    shop: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['fixed', 'evergreen'], required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    evergreenDuration: { type: Number, default: 24 }, // hours
    targetType: { type: String, enum: ['all', 'products', 'collections'], required: true },
    targetIds: [{ type: String }],
    targetDetails: [{ id: String, title: String, image: String }],
    design: {
      backgroundColor: { type: String, default: '#1a1a2e' },
      textColor: { type: String, default: '#FFFFFF' },
      urgencyColor: { type: String, default: '#cc0000' },
      position: { type: String, default: 'top' },
      text: { type: String, default: 'Offer ends in:' },
      size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
      urgencyType: { type: String, enum: ['color_pulse', 'color_change', 'none'], default: 'color_pulse' },
      urgencyThresholdMinutes: { type: Number, default: 60 },
    },
    impressions: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'paused', 'expired'], default: 'active' },
  },
  { timestamps: true }
);

// ── Performance indexes ──────────────────────────────────────────────────────
// Primary storefront query: shop + status — most selective compound index
timerSchema.index({ shop: 1, status: 1 });
// Secondary: also filter by targetType for collection-scoped timers
timerSchema.index({ shop: 1, status: 1, targetType: 1 });

export const Timer = mongoose.model<ITimer>('Timer', timerSchema);