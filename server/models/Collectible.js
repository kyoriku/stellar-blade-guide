const { Schema, model } = require('mongoose');

const collectibleSchema = new Schema({
  id: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  text: {
    type: Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function (value) {
        return typeof value === 'string' || Array.isArray(value);
      },
      message: props => `${props.value} is not a valid type for 'text'. Should be a string or an array.`
    }
  },
  type: {
    type: Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function (value) {
        return typeof value === 'string' || Array.isArray(value);
      },
      message: props => `${props.value} is not a valid type for 'text'. Should be a string or an array.`
    }
  },
  level: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  images: [
    {
      id: {
        type: Number,
        required: true,
      },
      src: {
        type: String,
        required: true,
      },
      alt: {
        type: String,
        required: true,
      },
    },
  ],
});

const Collectible = model('Collectible', collectibleSchema);

module.exports = Collectible;
