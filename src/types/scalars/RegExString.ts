import {GraphQLError, GraphQLScalarType, Kind, ValueNode} from 'graphql';

export const RegExString = (
    name: string,
    description: string,
    regex: RegExp,
): GraphQLScalarType => {
    const validate = (value: string): string => {
        if (!regex.test(value)) {
            throw new GraphQLError(
                `[${name}] Value must be match the pattern ${regex.source}: got ${value}`,
            );
        }
        return value;
    };

    return new GraphQLScalarType(
        {
            name: name,
            description: `${description} that ` +
                `* must match the pattern ${regex.source}`,
            parseLiteral: (
                valueNode: ValueNode,
            ): string => {
                if (valueNode.kind !== Kind.STRING) {
                    throw new GraphQLError(
                        `[${name}] Value is not string: got ${valueNode.kind}`,
                    );
                }

                return validate(valueNode.value);
            },
            parseValue: (
                inputValue: unknown,
            ): string => {
                if (typeof inputValue !== 'string') {
                    throw new TypeError(
                        `[${name}] Value is not string: got ${typeof inputValue}`,
                    );
                }

                return validate(inputValue);
            },
            serialize: (outputValue: unknown): string => {
                // TODO: Hash
                // @ts-ignore
                return outputValue.toString();
            },
        },
    );
};