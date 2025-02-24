import { resolve } from 'path';

import { Case, convertModelCase } from '../Case';
import type { Model } from '../client/interfaces/Model';
import type { HttpClient } from '../HttpClient';
import type { Indent } from '../Indent';
import { writeFile } from './fileSystem';
import { formatCode as f } from './formatCode';
import { formatIndentation as i } from './formatIndentation';
import type { Templates } from './registerHandlebarTemplates';

/**
 * Generate Models using the Handlebar template and write to disk.
 * @param models Array of Models to write
 * @param templates The loaded handlebar templates
 * @param outputPath Directory to write the generated files to
 * @param httpClient The selected httpClient (fetch, xhr, node or axios)
 * @param useUnionTypes Use union types instead of enums
 * @param useTuples Convert constant size arrays to tuples
 * @param indent Indentation options (4, 2 or tab)
 * @param transformCase Transform model case (camel, snake)
 */
export const writeClientModels = async (
    models: Model[],
    templates: Templates,
    outputPath: string,
    httpClient: HttpClient,
    useUnionTypes: boolean,
    useTuples: boolean,
    indent: Indent,
    transformCase: Case
): Promise<void> => {
    for (const model of models) {
        const newModel = transformCase === Case.NONE ? model : convertModelCase(model, transformCase);
        const file = resolve(outputPath, `${model.name}.ts`);
        const templateResult = templates.exports.model({
            ...newModel,
            httpClient,
            useUnionTypes,
            useTuples,
        });
        await writeFile(file, i(f(templateResult), indent));
    }
};
