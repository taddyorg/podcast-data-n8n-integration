import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	IHookFunctions,
	IDataObject,
	NodeOperationError,
} from 'n8n-workflow';
import { API_BASE_URL } from '../TaddyPodcast/constants';

/**
 * Taddy Podcast Webhook Trigger Node
 *
 * NOTE: This trigger is currently hidden (hidden: true) because Taddy webhooks
 * fire globally for ALL episodes without filtering support. This would overwhelm
 * workflows with thousands of triggers per hour.
 *
 * TO ENABLE THIS TRIGGER:
 * 1. Wait for Danny to implement webhook filtering on the Taddy API side
 * 2. Change "hidden: true" to "hidden: false" below
 * 3. Test with filtered webhooks
 * 4. Rebuild and publish: npm run build && npm publish
 *
 * Expected timeline: Mid-December 2025 per Danny's email
 */
export class TaddyPodcastWebhookTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Taddy Podcast Webhook Trigger',
		name: 'taddyPodcastWebhookTrigger',
		icon: 'file:taddy-api-logo.png',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["eventType"]}}',
		description:
			'Triggers instantly when a new podcast episode is published (requires webhook filtering)',
		defaults: {
			name: 'Taddy Webhook Trigger',
		},
		credentials: [
			{
				name: 'taddyPodcastApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		// IMPORTANT: Set to true to hide this trigger until filtering is available
		hidden: true,
		inputs: [],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				options: [
					{
						name: 'New Episode Published',
						value: 'podcastepisode.created',
					},
					{
						name: 'Episode Updated',
						value: 'podcastepisode.updated',
					},
					{
						name: 'Episode Deleted',
						value: 'podcastepisode.deleted',
					},
				],
				default: 'podcastepisode.created',
				required: true,
				description: 'Select which episode event to monitor',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookId = webhookData.webhookId as string | undefined;

				if (!webhookId) {
					return false;
				}

				const credentials = await this.getCredentials('taddyPodcastApi');
				const userId = credentials.userId as string;
				const apiKey = credentials.apiKey as string;

				// Query to check if webhook still exists
				const query = `
					query GetWebhook($id: ID!) {
						getWebhookForUser(id: $id) {
							id
							endpointUrl
							webhookEvents
							isActive
						}
					}
				`;

				try {
					const response = await this.helpers.httpRequest({
						method: 'POST',
						url: API_BASE_URL,
						headers: {
							'X-USER-ID': userId,
							'X-API-KEY': apiKey,
							'Content-Type': 'application/json',
						},
						body: {
							query,
							variables: { id: webhookId },
						},
					});

					if (response.errors && response.errors.length > 0) {
						// Webhook doesn't exist or error occurred
						return false;
					}

					return !!response.data?.getWebhookForUser;
				} catch (_error) {
					// Webhook doesn't exist
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const eventType = this.getNodeParameter('eventType') as string;

				// Validate webhook URL isn't localhost (unless in dev mode)
				// eslint-disable-next-line no-undef
				if (webhookUrl.includes('localhost') && process.env.NODE_ENV !== 'development') {
					throw new NodeOperationError(
						this.getNode(),
						'Webhook URL cannot be localhost in production. Use a publicly accessible URL (e.g., via ngrok for testing).',
					);
				}

				const credentials = await this.getCredentials('taddyPodcastApi');
				const userId = credentials.userId as string;
				const apiKey = credentials.apiKey as string;

				// Mutation to create webhook
				const mutation = `
					mutation AddWebhook($endpointUrl: String!, $webhookEvents: [String!]!) {
						addWebhookUrlForUser(
							endpointUrl: $endpointUrl,
							webhookEvents: $webhookEvents
						) {
							id
							endpointUrl
							webhookEvents
							isActive
							webhookSecret
						}
					}
				`;

				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: API_BASE_URL,
					headers: {
						'X-USER-ID': userId,
						'X-API-KEY': apiKey,
						'Content-Type': 'application/json',
					},
					body: {
						query: mutation,
						variables: {
							endpointUrl: webhookUrl,
							webhookEvents: [eventType],
						},
					},
				});

				if (response.errors && response.errors.length > 0) {
					const errorMessages = response.errors.map((err: IDataObject) => err.message).join(', ');
					throw new NodeOperationError(
						this.getNode(),
						`Failed to create webhook: ${errorMessages}`,
					);
				}

				const webhook = response.data.addWebhookUrlForUser;

				// Store webhook data in workflow static data
				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = webhook.id;
				webhookData.webhookSecret = webhook.webhookSecret;
				webhookData.webhookEvents = webhook.webhookEvents;

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookId = webhookData.webhookId as string | undefined;

				if (!webhookId) {
					// No webhook to delete
					return true;
				}

				const credentials = await this.getCredentials('taddyPodcastApi');
				const userId = credentials.userId as string;
				const apiKey = credentials.apiKey as string;

				// Mutation to delete webhook
				const mutation = `
					mutation DeleteWebhook($id: ID!) {
						deleteWebhookForUser(id: $id)
					}
				`;

				try {
					await this.helpers.httpRequest({
						method: 'POST',
						url: API_BASE_URL,
						headers: {
							'X-USER-ID': userId,
							'X-API-KEY': apiKey,
							'Content-Type': 'application/json',
						},
						body: {
							query: mutation,
							variables: { id: webhookId },
						},
					});

					// Clear stored webhook data
					delete webhookData.webhookId;
					delete webhookData.webhookSecret;
					delete webhookData.webhookEvents;

					return true;
				} catch (error) {
					// Even if deletion fails, clear the data
					delete webhookData.webhookId;
					delete webhookData.webhookSecret;
					delete webhookData.webhookEvents;

					return false;
				}
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const webhookData = this.getWorkflowStaticData('node');
		const expectedSecret = webhookData.webhookSecret as string | undefined;

		// Verify webhook secret
		const headers = this.getHeaderData();
		const incomingSecret = headers['x-taddy-webhook-secret'] as string | undefined;

		if (expectedSecret && incomingSecret !== expectedSecret) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid webhook secret. Webhook verification failed.',
			);
		}

		// Get the webhook payload
		const body = this.getBodyData();

		// Extract episode data from webhook payload
		// Expected structure: { action: string, taddyType: string, timestamp: number, data: {...} }
		const payload = body as IDataObject;
		const episode = payload.data as IDataObject;

		// Add metadata for debugging
		const enrichedEpisode = {
			...episode,
			_webhookEvent: payload.action,
			_webhookTimestamp: payload.timestamp,
			_webhookType: payload.taddyType,
		};

		return {
			workflowData: [this.helpers.returnJsonArray([enrichedEpisode])],
		};
	}
}
