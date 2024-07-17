// Importing the necessary modules from the 'mongoose' package
const { Schema, model } = require('mongoose');

// Defining the schema for the 'Collectible' model
const collectibleSchema = new Schema(
  {
    // Defining the 'id' field of type Number, which is required
    id: {
      type: Number,
      required: true,
    },
    // Defining the 'title' field of type String, which is required
    title: {
      type: String,
      required: true,
    },
    // Defining the 'text' field of type Mixed, which can be either a string or an array
    text: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        // Custom validator function to validate that the value is either a string or an array
        validator: function (value) {
          return typeof value === 'string' || Array.isArray(value);
        },
        // Error message to be displayed if the validation fails
        message: props => `${props.value} is not a valid type for 'text'. Should be a string or an array.`
      }
    },
    // Defining the 'type' field of type Mixed, which can be either a string or an array
    type: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        // Custom validator function to validate that the value is either a string or an array
        validator: function (value) {
          return typeof value === 'string' || Array.isArray(value);
        },
        // Error message to be displayed if the validation fails
        message: props => `${props.value} is not a valid type for 'text'. Should be a string or an array.`
      }
    },
    // Defining the 'level' field of type String, which is required
    level: {
      type: String,
      required: true,
    },
    // Defining the 'location' field of type String, which is required
    location: {
      type: String,
      required: true,
    },
    // Defining the 'images' field as an array of objects
    images: [
      {
        // Defining the 'id' field of type Number, which is required
        id: {
          type: Number,
          required: true,
        },
        // Defining the 'src' field of type String, which is required
        src: {
          type: String,
          required: true,
        },
        // Defining the 'alt' field of type String, which is required
        alt: {
          type: String,
          required: true,
        },
      },
    ],
  }
);

// Creating a model named 'Collectible' using the defined schema
const Collectible = model('Collectible', collectibleSchema);

// Exporting the 'Collectible' model to be used in other parts of the application
module.exports = Collectible;
