import { INodeType, IExecuteFunctions, INodeExecutionData, NodeOperationError, IDataObject } from 'n8n-workflow';
import { taddyPodcastDescription, handleOperation } from './queries';
import { Operation, ApiError } from './constants';

export class TaddyPodcast implements INodeType {
	description = taddyPodcastDescription;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as Operation;

			try {
				const responseData = await handleOperation(operation, i, this);
				returnData.push({ json: responseData });
			} catch (error: unknown) {
				const apiError = error as ApiError;
				const errorData: IDataObject = {
					operation,
					timestamp: new Date().toISOString(),
					error: apiError.message || 'Unknown error',
					status: apiError.response?.status || 0,
					statusText: apiError.response?.statusText || '',
					responseBody: JSON.stringify(apiError.response?.data || {}),
				};

				if (this.continueOnFail()) {
					returnData.push({ json: errorData });
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Taddy API Error: ${JSON.stringify(errorData, null, 2)}`,
					);
				}
			}
		}

		return [returnData];
	}
}
