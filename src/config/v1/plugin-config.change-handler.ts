// import { Injectable } from '@nestjs/common';
// import deepDiff from 'deep-diff-pizza';
// import jmesPath from 'jmespath';

// @Injectable()
// export class PluginConfigChangeHandler {
//   onPlatformConfigurationReloaded({
//     before,
//     after,
//   }: PlatformConfigBeforeAfter) {
//     const diff = deepDiff(before, after);
//     const specificChanges = jmesPath.search(
//       diff,
//       '[?operation!=`UNCHANGED`] | ' +
//         '{' +
//         ' devices: [?starts_with(path, `device`)],' +
//         ' credentials: [?path==`username`||path==`password`]' +
//         ' ' +
//         '}',
//     );

//     // this.log.info(specificChanges, specificChanges?.devices);

//     const deviceIds: Set<string> = specificChanges.devices.reduce(
//       (acc: Set<string>, cur) => {
//         const deviceTypeIndex: string = cur['path']?.split('.')[1] ?? undefined;
//         if (!deviceTypeIndex) {
//           return acc;
//         }
//         const isMatch = /.+\[(?<index>\d+)\]/.exec(deviceTypeIndex);
//         if (!isMatch || !isMatch.groups || !isMatch.groups['index']) {
//           return acc;
//         }
//         const deviceIndex = isMatch.groups['index'];
//         const deviceType = deviceTypeIndex.substring(
//           0,
//           deviceTypeIndex.indexOf('['),
//         );
//         const devices = before.devices
//           ? before.devices[deviceType]
//           : after.devices
//             ? after.devices[deviceType]
//             : undefined;
//         if (!devices) {
//           return acc;
//         }
//         acc.add(devices[deviceIndex].deviceId);
//         return acc;
//       },
//       new Set<string>(),
//     );

//     console.dir(deviceIds);
//   }
// }
