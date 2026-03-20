import { NativeModules, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';

import type { ExportPreset } from '@/models/entities';
import { createId } from '@/utils/ids';

type AdvancedExportModule = {
  createPdfFromImage: (
    imagePath: string,
    title: string,
    summaryJson: string,
  ) => Promise<string>;
  createLoopFromImage: (imagePath: string, title: string) => Promise<string>;
};

const advancedExportModule = NativeModules.BondaExportModule as
  | AdvancedExportModule
  | undefined;

async function ensureExportDirectory(): Promise<string> {
  const directoryPath = `${RNFS.DocumentDirectoryPath}/exports`;
  const exists = await RNFS.exists(directoryPath);

  if (!exists) {
    await RNFS.mkdir(directoryPath);
  }

  return directoryPath;
}

async function duplicateExportFile(
  sourcePath: string,
  outputFileName: string,
): Promise<string> {
  const directoryPath = await ensureExportDirectory();
  const extension = sourcePath.split('.').pop() ?? 'png';
  const targetPath = `${directoryPath}/${outputFileName}.${extension}`;
  await RNFS.copyFile(sourcePath, targetPath);
  return targetPath;
}

export async function exportFromRef(options: {
  ref: React.RefObject<unknown>;
  title: string;
  type: ExportPreset['type'];
  hideNames: boolean;
  summaryPayload: object;
}): Promise<ExportPreset> {
  const capturePath = await captureRef(options.ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
  const fileBase = `${options.title
    .toLowerCase()
    .replace(/\s+/g, '-')}-${Date.now()}`;
  let filePath = capturePath;

  try {
    if (options.type === 'poster' || options.type === 'stats') {
      filePath = await duplicateExportFile(capturePath, fileBase);
    } else if (
      Platform.OS === 'ios' &&
      advancedExportModule &&
      options.type === 'pdf'
    ) {
      filePath = await advancedExportModule.createPdfFromImage(
        capturePath,
        options.title,
        JSON.stringify(options.summaryPayload),
      );
    } else if (
      Platform.OS === 'ios' &&
      advancedExportModule &&
      options.type === 'loop'
    ) {
      filePath = await advancedExportModule.createLoopFromImage(
        capturePath,
        options.title,
      );
    } else {
      filePath = await duplicateExportFile(capturePath, fileBase);
    }
  } catch {
    filePath = await duplicateExportFile(capturePath, fileBase);
  }

  return {
    id: createId(),
    type: options.type,
    title: options.title,
    hideNames: options.hideNames,
    createdAt: new Date().toISOString(),
    filePath,
  };
}

export async function shareExport(preset: ExportPreset): Promise<void> {
  if (!preset.filePath) {
    return;
  }

  await Share.open({
    url: `file://${preset.filePath}`,
    failOnCancel: false,
  });
}
