import {GraphQLError, GraphQLScalarType, Kind, ValueNode} from 'graphql';
import {NumberConstraints} from '../../config/validation/NumberConstraints';

export const ConstrainedNumber = (
    name: string,
    description: string,
    constraints: NumberConstraints,
): GraphQLScalarType => {
    const {
        clamp,
        min,
        max,
        onlyOdd,
        onlyEven,
    } = constraints;
    const validate = (value: number): number => {
        let validatedValue = value;
        if (min && value < min) {
            if (!clamp) {
                throw new GraphQLError(
                    `[${name}] Value must be greater than ${min}: got ${value}`,
                );
            }
            validatedValue = min;
        }
        if (max && value > max) {
            if (!clamp) {
                throw new GraphQLError(
                    `[${name}] Value must be less than ${max}: got ${value}`,
                );
            }
            validatedValue = max;
        }
        if (onlyOdd && value % 2 !== 1) {
            throw new GraphQLError(
                `[${name}] Value must be an odd number: got ${value}`,
            );
        }
        if (onlyEven && value % 2 !== 0) {
            throw new GraphQLError(
                `[${name}] Value must be an even number: got ${value}`,
            );
        }

        return validatedValue;
    };

    const minDescription =
        constraints.min
        && `is greater than ${constraints.min}`;
    const maxDescription =
        constraints.max
        && `is less than ${constraints.max}`;
    const clampDescription =
        constraints.clamp
        && 'sets the value to the min or max if outside range';
    const oddDescription =
        constraints.onlyOdd
        && 'is an odd integer';
    const evenDescription =
        constraints.onlyEven
        && 'is an even integer';

    return new GraphQLScalarType(
        {
            name: name,
            description: `${description}\n that` +
                `* ${minDescription}\n` +
                `* ${maxDescription}\n` +
                `* ${clampDescription}\n` +
                `* ${evenDescription}\n` +
                `* ${oddDescription}`,
            parseLiteral: (
                valueNode: ValueNode,
            ): string => {
                if (valueNode.kind !== Kind.STRING && valueNode.kind !== Kind.INT) {
                    throw new GraphQLError(
                        `[${name}] Value is not string or integer: got ${valueNode.kind}`,
                    );
                }
                return validate(parseInt(valueNode.value)).toString();
            },
            parseValue: (
                inputValue: unknown,
            ): string => {
                if (typeof inputValue !== 'string' && typeof inputValue !== 'number') {
                    throw new TypeError(
                        `[${name}] Value is not string or integer : ${typeof inputValue}`,
                    );
                }
                return validate(parseInt(inputValue.toString())).toString();
            },
            serialize: (outputValue: unknown): string => {
                // TODO: Hash
                // @ts-ignore
                return outputValue.toString();
            },
        },
    );
};
