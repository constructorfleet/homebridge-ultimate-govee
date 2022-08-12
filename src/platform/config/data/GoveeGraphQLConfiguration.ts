import {GoveeDefaultConfiguration} from './GoveeDefaultConfiguration'

export interface GoveeGraphQLConfiguration extends GoveeDefaultConfiguration {
  graphQLListenPort: number;
  authToken: string;
  introspection: boolean;
  playground: true;
}
