import {GraphQLError, GraphQLScalarType, Kind} from 'graphql';

const DEVICE_ID_REGEX =
  /^(?:[\dA-Fa-f]{2}([:-]?)[\dA-Fa-f]{2})(?:(?:\1|\.)(?:[\dA-Fa-f]{2}([:-]?)[\dA-Fa-f]{2})){2}(([:-]?)[\dA-Fa-f]{2})?$/;

const validate = (value: any) => {
  if (typeof value !== 'string') {
    throw new TypeError(`Value is not string: ${value}`);
  }

  if (!DEVICE_ID_REGEX.test(value)) {
    throw new TypeError(`Value is not a valid device identifier: ${value}`);
  }

  return value;
};

export const DeviceIdentifier = new GraphQLScalarType({
  name: 'DeviceIdentifier',
  description: 'The unique identifier for a given device.',
  serialize(value) {
    return validate(value);
  },
  parseValue(value) {
    return validate(value);
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Expected a string that fulfills the device identifier specification, got ${ast.kind}`,
      );
    }

    return validate(ast.value);
  },
  extensions: {
    codegenScalarType: 'string',
  },
},
);
