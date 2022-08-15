import {gql} from 'apollo-server';

export const typeDefs = gql`
  interface GoveeDevice {
    
    OFF
    ISSUE
  }
  
  enum ActiveState {
    ON
    OFF
    IDLE
    ISSUE
  }
  
  enum ConnectionState {
    CONNECTED
    DISCONNECTED
  }
`;
