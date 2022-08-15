import {GraphQLError, GraphQLScalarType, Kind} from 'graphql';
import {isNumber} from '@nestjs/common/utils/shared.utils';

export const PactCode = new GraphQLScalarType({
  name: 'PactCode',
  description: 'The PactCode associated with this device.',
  serialize(value) {
    if (!isNumber(value)) {
      throw new TypeError(`Expected a numeric value for PactCode, got ${value}`);
    }

    return value;
  },
  parseValue(value) {
    if (!isNumber(value)) {
      throw new TypeError(`Expected a numeric value for PactCode, got ${value}`);
    }

    return value;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.INT) {
      throw new GraphQLError(
        `Expected an integer PactCode value, got ${ast.kind}`,
      );
    }

    return parseInt(ast.value);
  },
  extensions: {
    codegenScalarType: 'number',
  },
});
