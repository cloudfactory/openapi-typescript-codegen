import { OpenApiParameter } from '../interfaces/OpenApiParameter';
import { getType } from './getType';
import { Parameter } from '../../../client/interfaces/Parameter';
import { Type } from '../../../client/interfaces/Type';
import { OpenApi } from '../interfaces/OpenApi';
import { getParameterName } from './getParameterName';
import { getArrayType } from './getArrayType';
import { ArrayType } from '../../../client/interfaces/ArrayType';
import { getEnumType } from './getEnumType';
import { getEnumTypeFromDescription } from './getEnumTypeFromDescription';
import { getComment } from './getComment';
import { SchemaReference } from '../../../client/interfaces/SchemaReference';
import { getSchemaReference } from './getSchemaReference';

export function getParameter(openApi: OpenApi, parameter: OpenApiParameter): Parameter {
    const result: Parameter = {
        in: parameter.in,
        prop: parameter.name,
        name: getParameterName(parameter.name),
        type: 'any',
        base: 'any',
        template: null,
        description: getComment(parameter.description),
        default: parameter.default,
        required: parameter.required || false,
        nullable: false,
        imports: [],
    };

    // If the parameter has a type than it can be a basic or generic type.
    if (parameter.type) {
        const parameterType: Type = getType(parameter.type);
        result.type = parameterType.type;
        result.base = parameterType.base;
        result.template = parameterType.template;
        result.imports.push(...parameterType.imports);

        // If the parameter is an Array type, we check for the child type,
        // so we can create a typed array, otherwise this will be a "any[]".
        if (parameter.type === 'array' && parameter.items) {
            const arrayType: ArrayType = getArrayType(parameter.items);
            result.type = `${arrayType.type}[]`;
            result.base = arrayType.base;
            result.template = arrayType.template;
            result.imports.push(...arrayType.imports);
        }
    }

    // If this parameter has a schema, then we need to check two things:
    // if this is a reference then the parameter is just the 'name' of
    // this reference type. Otherwise it might be a complex schema and
    // then we need to parse the schema!
    if (parameter.schema) {
        const parameterSchema: SchemaReference = getSchemaReference(openApi, parameter.schema);
        result.type = parameterSchema.type;
        result.base = parameterSchema.base;
        result.template = parameterSchema.template;
        result.imports.push(...parameterSchema.imports);
    }

    // If the param is a enum then return the values as an inline type.
    if (parameter.enum) {
        result.type = getEnumType(parameter.enum);
        result.base = 'string';
        result.imports = [];
    }

    // Check if this could be a special enum where values are documented in the description.
    if (parameter.description && parameter.type === 'int') {
        const enumType: string | null = getEnumTypeFromDescription(parameter.description);
        if (enumType) {
            result.type = enumType;
            result.base = 'number';
            result.imports = [];
        }
    }

    return result;
}
