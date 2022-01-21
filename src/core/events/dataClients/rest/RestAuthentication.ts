import {RestEvent} from './RestEvent';
import {AuthenticationData} from '../../../structures/AuthenticationData';

export class RestAuthenticateEvent
  extends RestEvent<unknown> {

  constructor() {
    super('Authenticate', {});
  }
}

export class RestAuthenticatedEvent<AuthType extends AuthenticationData>
  extends RestEvent<AuthType> {

  constructor(
    eventData: AuthType,
  ) {
    super('Authenticated', eventData);
  }
}