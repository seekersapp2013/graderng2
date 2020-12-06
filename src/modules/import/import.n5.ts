import type { INormalizedImport, ITrackers, ICluster } from "./import";
import TrackerConfig from "../tracker/tracker";
import Board from "../board/board";
import type { IBoard } from "../board/board";
import NLog from "../nomie-log/nomie-log";

import { Dashboard } from "../dashboard/dashboard";
import Person from "../person/person";
import Location from "../locate/Location";

function getTrackers(fileData: any): ITrackers {
  let trackers: ITrackers = {};
  Object.keys(fileData.trackers).forEach((trackerTag) => {
    trackers[trackerTag] = new TrackerConfig(fileData.trackers[trackerTag]);
  });
  return trackers;
}

function getCluster(fileData: any): ICluster {
  let Cluster: ICluster = {};
  Object.keys(fileData.Cluster || {}).forEach((personId) => {
    Cluster[personId] = new Person(fileData.Cluster[personId]);
  });
  return Cluster;
}

function getBoards(fileData: any): Array<IBoard> {
  return (fileData.boards || []).map((board) => {
    return new Board(board);
  });
}

function getDashboards(fileData: any): Array<Dashboard> {
  let dashboards = [];
  if (fileData.dashboards && fileData.dashboards.dashboards) {
    dashboards = fileData.dashboards.dashboards;
  } else if (fileData.dashboards) {
    dashboards = fileData.dashboards;
  }
  dashboards = dashboards.map((dash) => {
    return new Dashboard(dash);
  });
  return dashboards;
}

function getLogs(fileData: any): Array<NLog> {
  return (fileData.events || []).map((evt) => {
    return new NLog(evt);
  });
}

export function N5ImportNormalizer(importer: any): INormalizedImport {
  let final: INormalizedImport = {
    trackers: getTrackers(importer),
    boards: getBoards(importer),
    logs: getLogs(importer),
    Cluster: getCluster(importer),
    context: importer.context || [],
    locations: (importer.locations || []).map((loc) => {
      return new Location(loc);
    }),
    dashboards: getDashboards(importer),
  };

  return final;
}
