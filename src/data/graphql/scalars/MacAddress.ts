import {GraphQLError, GraphQLScalarType, Kind} from 'graphql';

const MAC_REGEX =
  /^(?:[\dA-Fa-f]{2}([:-]?)[\dA-Fa-f]{2})(?:(?:\1|\.)(?:[\dA-Fa-f]{2}([:-]?)[\dA-Fa-f]{2})){2}$/;

const validate = (value: any) => {
  if (typeof value !== 'string') {
    throw new TypeError(`Value is not string: ${value}`);
  }

  if (!MAC_REGEX.test(value)) {
    throw new TypeError(`Value is not a valid MAC address: ${value}`);
  }

  return value;
};

export const MacAddress = new GraphQLScalarType({
  name: 'MacAddress',
  description: 'The MAC address for the device\'s network communication',
  serialize(value) {
    return validate(value);
  },
  parseValue(value) {
    return validate(value);
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Expected a string that fulfills the Mac Address specification, got ${ast.kind}`,
      );
    }

    return validate(ast.value);
  },
  extensions: {
    codegenScalarType: 'string',
  },
});
