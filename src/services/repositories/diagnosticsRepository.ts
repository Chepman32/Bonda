import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { DIAGNOSTICS_LOG_FILE, MAX_DIAGNOSTIC_EVENTS } from '@/constants/app';
import type { DiagnosticEvent } from '@/models/entities';
import { getDataRepository } from '@/services/repositories/dataRepository';
import { createId } from '@/utils/ids';

function getDiagnosticsPath(): string {
  return `${RNFS.DocumentDirectoryPath}/${DIAGNOSTICS_LOG_FILE}`;
}

export class DiagnosticsRepository {
  private readonly dataRepository = getDataRepository();

  public async log(
    level: DiagnosticEvent['level'],
    message: string,
    context?: Record<string, unknown>,
  ): Promise<DiagnosticEvent> {
    const event: DiagnosticEvent = {
      id: createId(),
      level,
      message,
      context,
      createdAt: new Date().toISOString(),
    };

    await this.dataRepository.saveDiagnostic(event);
    await this.appendToFile(event);
    return event;
  }

  public async listRecentEvents(): Promise<DiagnosticEvent[]> {
    return this.dataRepository.listDiagnostics(MAX_DIAGNOSTIC_EVENTS);
  }

  public async shareLogFile(): Promise<void> {
    const path = getDiagnosticsPath();
    const exists = await RNFS.exists(path);

    if (!exists) {
      return;
    }

    await Share.open({
      url: `file://${path}`,
      type: 'application/json',
      failOnCancel: false,
    });
  }

  private async appendToFile(event: DiagnosticEvent): Promise<void> {
    const path = getDiagnosticsPath();
    const exists = await RNFS.exists(path);
    const line = `${JSON.stringify(event)}\n`;

    if (!exists) {
      await RNFS.writeFile(path, line, 'utf8');
      return;
    }

    await RNFS.appendFile(path, line, 'utf8');
    await this.trimFile(path);
  }

  private async trimFile(path: string): Promise<void> {
    const content = await RNFS.readFile(path, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);

    if (lines.length <= MAX_DIAGNOSTIC_EVENTS) {
      return;
    }

    await RNFS.writeFile(
      path,
      `${lines.slice(lines.length - MAX_DIAGNOSTIC_EVENTS).join('\n')}\n`,
      'utf8',
    );
  }
}

let repositoryInstance: DiagnosticsRepository | undefined;

export function getDiagnosticsRepository(): DiagnosticsRepository {
  repositoryInstance ??= new DiagnosticsRepository();
  return repositoryInstance;
}
