
import Joi from 'joi';

const hexColor = Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);

export const timerValidationSchema = Joi.object({
  name: Joi.string().trim().required(),
  type: Joi.string().valid('fixed', 'evergreen').required(),

  // Fixed timers: both dates are required and end must be after start
  startDate: Joi.when('type', {
    is: 'fixed',
    then: Joi.date().iso().required(),
    otherwise: Joi.date().iso().optional(),
  }),
  endDate: Joi.when('type', {
    is: 'fixed',
    then: Joi.date().iso().greater(Joi.ref('startDate')).required()
      .messages({ 'date.greater': 'End date/time must be after start date/time.' }),
    otherwise: Joi.date().iso().optional(),
  }),

  // Evergreen: configurable session duration in hours (1–720, default 24)
  evergreenDuration: Joi.when('type', {
    is: 'evergreen',
    then: Joi.number().integer().min(1).max(720).default(24),
    otherwise: Joi.number().integer().optional(),
  }),

  targetType: Joi.string().valid('all', 'products', 'collections').required(),

  // targetIds required (min 1) only when targeting specific products/collections
  targetIds: Joi.when('targetType', {
    is: Joi.valid('products', 'collections'),
    then: Joi.array().items(Joi.string()).min(1).required()
      .messages({ 'array.min': '"targetIds" must contain at least 1 item when targeting specific products or collections.' }),
    otherwise: Joi.array().items(Joi.string()).optional().default([]),
  }),

  targetDetails: Joi.array()
    .items(
      Joi.object({
        id: Joi.string(),
        title: Joi.string().allow('', null),
        image: Joi.string().allow('', null),
        _id: Joi.any().optional(),
      })
    )
    .optional(),

  design: Joi.object({
    backgroundColor: hexColor.default('#1a1a2e'),
    textColor: hexColor.default('#ffffff'),
    urgencyColor: hexColor.default('#cc0000'),
    position: Joi.string().valid('top', 'bottom', 'custom').default('top'),
    text: Joi.string().default('Offer ends in:'),
    size: Joi.string().valid('small', 'medium', 'large').default('medium'),
    urgencyType: Joi.string().valid('color_pulse', 'color_change', 'none').default('color_pulse'),
    urgencyThresholdMinutes: Joi.number().integer().min(0).max(1440).default(60),
  }).optional(),

  status: Joi.string().valid('active', 'paused', 'expired').default('active'),
});