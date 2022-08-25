import {GraphQLError, GraphQLScalarType, Kind, ValueNode} from 'graphql';
import {IntValueNode} from "graphql/language/ast";

export const FanSpeed = new GraphQLScalarType(
    {
        name: 'FanSpeed',
        description: 'Speed of a fan from 0% - 100%',
        parseLiteral: (
            valueNode: ValueNode
        ): number => {
            if (valueNode.kind !== Kind.INT) {
                throw new GraphQLError(
                    `[FanSpeed] Value is not int : ${valueNode.kind}`,
                )
            }
            const fanSpeed = parseInt(valueNode.value) || 0;
            return Math.min(
                100,
                Math.max(
                    0,
                    fanSpeed
                )
            )
        }
    }
)
