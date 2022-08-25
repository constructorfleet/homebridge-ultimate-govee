import {Field, ObjectType} from '@nestjs/graphql';
import {DeviceMode} from '../../interfaces';
import {SceneId} from '../../scalars';

@ObjectType(
  'SceneMode',
  {
    description: 'Definition of a device scene mode',
    implements: () => [DeviceMode],
  },
)
export class SceneMode implements DeviceMode {
    @Field(
      () => SceneId,
      {
        name: 'sceneId',
        description: 'The identifier of the active scene',
      },
    )
    sceneId!: number;

    id!: number;

}