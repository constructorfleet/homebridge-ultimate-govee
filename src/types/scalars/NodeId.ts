import {GraphQLError, GraphQLScalarType, Kind, ValueNode} from 'graphql';
import {StringValueNode} from 'graphql/language/ast';
import {base, isBase64, toId} from '../../util/nodeEncoder';

const KEY_OBJECT_NAME = 'objectName';
const KEY_ID = 'id';
const NODE_ID_REGEX = /^\S+:\S+$/;

export const NodeId = new GraphQLScalarType(
    {
        name: 'NodeId',
        description: 'Node identifier of the form \'OBJECTNAME:ID\' and base64 encoded.\n' +
            'Acceptable inputs are:\n' +
            '* base64 encoded string of above form\n' +
            '* raw string of above form\n' +
            `* Object with keys: '${KEY_OBJECT_NAME}' and '${KEY_ID}'`,
        parseLiteral: (
            valueNode: ValueNode,
        ): string => {
            if (valueNode.kind === Kind.OBJECT) {
                const objectName: StringValueNode | null = valueNode.fields.find(
                    (fieldNode) =>
                        fieldNode.name.value === KEY_OBJECT_NAME && fieldNode.value.kind === Kind.STRING,
                )?.value as StringValueNode;
                const id: StringValueNode = valueNode.fields.find(
                    (fieldNode) =>
                        fieldNode.name.value === KEY_ID && fieldNode.value.kind === Kind.STRING,
                )?.value as StringValueNode;
                if (!objectName || !id) {
                    throw new GraphQLError(
                        `[NodeId] Value does not have the appropriate form {${KEY_OBJECT_NAME}: string, ${KEY_ID}: string}`,
                    );
                }
                return toId(
                    objectName.value,
                    id.value,
                );
            }

            if (valueNode.kind !== Kind.STRING) {
                throw new GraphQLError(
                    `[NodeId] Value is not string : ${valueNode.kind}`,
                );
            }

            if (!isBase64(valueNode.value)) {
                if (!NODE_ID_REGEX.test(valueNode.value)) {
                    throw new GraphQLError(
                        '[NodeId] Value is not base64 encoded or the wrong form.',
                    );
                }
                const parts = valueNode.value.split(':');
                return toId(
                    parts[0],
                    parts[1],
                );
            }

            // It's base64 - assume it's right
            return valueNode.value;
        },
        parseValue: (inputValue: unknown): string => {
            if (inputValue && typeof inputValue === 'object') {
                const inputObject = inputValue as object;
                const objectName: string | null = inputObject[KEY_OBJECT_NAME] || null;
                const id: string | null = inputObject[KEY_ID] || null;
                if (!objectName || !id) {
                    throw new TypeError(
                        `[NodeId] Value does not have the appropriate form {${KEY_OBJECT_NAME}: string, ${KEY_ID}: string}`,
                    );
                }
                return toId(
                    objectName,
                    id,
                );
            }
            if (typeof inputValue !== 'string') {
                throw new TypeError(
                    `[NodeId] Value is not string : ${typeof inputValue}`,
                );
            }
            if (!isBase64(inputValue)) {
                if (!NODE_ID_REGEX.test(inputValue)) {
                    throw new TypeError(
                        '[NodeId] Value is not base64 encoded or the wrong form.',
                    );
                }
                return base(inputValue);
            }

            return inputValue;
        },
        serialize: (outputValue: unknown): string => {
            if (outputValue === undefined) {
                return '';
            }
            if (typeof outputValue === 'string') {
                if (!isBase64(outputValue)) {
                    return base(outputValue);
                }
                return outputValue;
            }
            if (typeof outputValue !== 'object') {
                throw new TypeError(
                    `[NodeId] Value does not have the appropriate form {${KEY_OBJECT_NAME}: string, ${KEY_ID}: string}`,
                );
            }
            if (outputValue === null || typeof (outputValue) !== 'object') {
                return '';
            }
            return toId(
                outputValue[KEY_OBJECT_NAME],
                outputValue[KEY_ID],
            );
        },
    },
);
