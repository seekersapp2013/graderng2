/**
 * Cluster Store
 
 */

// Svelte
import { writable } from "svelte/store";

// utils
import Logger from "../utils/log/log";
import math from "../utils/math/math";
import snakeCase from "../utils/snake-case/snake-case";
import NomieLog from "../modules/nomie-log/nomie-log";

// Vendors
import Storage from "../modules/storage/storage";

// Get Config
import config from "../config/appConfig";

import { LedgerStore } from "./ledger";
import { Interact } from "./interact";
import { Lang } from "./lang";

import dayjs from "dayjs";

import Person from "../modules/person/person";

const console = new Logger("🗺 $ClusterStore");

const toUsername = (username) => {
  username = username.replace("@", "").trim();
  username = snakeCase(username);
  return username.toLowerCase();
};

function getState() {
  let returnState;
  update((state) => {
    returnState = state;
    return state;
  });
  return returnState;
}

const searchForCluster = async () => {
  let loadingFinished = Interact.loading("Finding @usernames...");
  const logs = await LedgerStore.query({ start: dayjs().subtract(3, "month") });

  let Cluster = [];
  logs.forEach((log) => {
    let meta = log.getMeta();
    // Array of usernames.
    meta.Cluster.forEach((personElement) => {
      let username = personElement.id.toLowerCase();
      Cluster.push({ username, last: new Date(log.end) });
    });
    // Cluster = [...Cluster, ...meta.Cluster];
  });

  let map = {};
  Cluster.forEach((person) => {
    map[person.username] = map[person.username] || { username: person.username, dates: [] };
    map[person.username].dates.push(person.last);
  });

  let final = Object.keys(map).map((username) => {
    let dates = map[username].dates.sort((a, b) => {
      a > b ? 1 : -1;
    });
    return {
      username,
      last: dates[0],
    };
  });

  loadingFinished();
  return final;
};

/**
 * Cluster STORE
 * Used for global Cluster things!
 * March 8 2020 - the Coronavirus COVID-19 is getting crazy.
 */

const ClusterInit = () => {
  const ClusterState = {
    Cluster: {},
    stats: {},
  };
  const { update, subscribe, set } = writable(ClusterState);

  const methods = {
    async init() {
      await methods.getCluster();
      // Refresh the Cluster every minute
      // This should help with blockstack users
      setInterval(() => {
        methods.getCluster();
      }, 1000 * 60 * 5);
    },
    savePerson(person) {
      update((state) => {
        state.Cluster[person.username] = person;
        this.write(state.Cluster);
        return state;
      });
    },
    async deletePerson(person) {
      update((state) => {
        if (typeof person == "string") {
          delete state.Cluster[person];
        } else {
          delete state.Cluster[person.username];
        }
        return state;
      });
      return methods.writeState();
    },
    get(name) {
      let person;
      update((state) => {
        if (state.Cluster.hasOwnProperty(name)) {
          person = state.Cluster[name];
        } else {
          person = new Person(name);
        }
        return state;
      });
      return person;
    },
    async getCluster() {
      // Get Cluster from storage
      let Cluster = await Storage.get(`${config.data_root}/${config.data_Cluster_key}.json`);
      // Update State
      update((state) => {
        let stateCluster = state.Cluster;
        if (Cluster) {
          // Turn it in to a Person Object
          Object.keys(Cluster)
            .filter((row) => row)
            .forEach((personKey) => {
              stateCluster[personKey.toLowerCase()] = new Person(Cluster[personKey]);
            });
        }
        state.Cluster = stateCluster;
        return state;
      });
      return Cluster;
    },
    async saveFoundCluster(ClusterArray) {
      update((state) => {
        state.Cluster = state.Cluster || {};
        let changed = false;

        // Loop over array of Cluster { username: x, last: date }
        ClusterArray.forEach((person) => {
          if (typeof person != "string") {
            // If this is a new person
            if (!state.Cluster.hasOwnProperty(person.username)) {
              state.Cluster[person.username] = new Person(person.username);
              state.Cluster[person.username].last = person.last || new Date();
              changed = true;
            } else {
              // If the current LAST date is less than (older) than the one provided
              // use the one provided, otherwise do nothing.
              if (state.Cluster[person.username].last < person.last) {
                state.Cluster[person.username].last = person.last;
                changed = true;
              }
            }
          } else {
            // Should no longer ever happen
            Interact.alert("Error", "Sorry saveCluster was called with just a string. Please report this!");
          }
        });

        // Has Changes?
        if (changed) {
          this.write(state.Cluster);
        }
        // Return state to update
        return state;
      });
    },
    async addByName(personName) {
      let person;
      let _state;
      if (personName) {
        let username = toUsername(personName).toLowerCase();
        let added = false;
        update((state) => {
          state.Cluster = state.Cluster || {};
          if (!state.Cluster.hasOwnProperty(username)) {
            person = new Person({ username: username, displayName: personName });
            state.Cluster[username] = person;
            added = true;
          }
          _state = state;
          return state;
        });
        if (added) {
          this.write(_state.Cluster);
          return _state.Cluster[username];
        } else {
          throw new Error("That username is already taken, please try another name.");
        }
      }
      return person;
    },
    async writeState() {
      update((state) => {
        methods.write(state.Cluster);
        return state;
      });
    },
    async write(payload) {
      return Storage.put(`${config.data_root}/${config.data_Cluster_key}.json`, payload);
    },
    // async stats(options = {}) {
    //   return await getRecentClusterStats();
    // },
    async searchForCluster() {
      let Cluster = await searchForCluster();
      if (Cluster.length) {
        const confirm = await Interact.confirm(`${Cluster.length} @username's found`, "Add them to your Cluster list?");
        if (confirm) {
          await methods.saveFoundCluster(Cluster);
          Interact.alert("👍 Cluster list updated!");
        }
      } else {
        Interact.alert(`Sorry, no @username's found in the last 6 months`);
      }
    },
  };

  return {
    update,
    subscribe,
    set,
    ...methods,
  };
};

export const ClusterStore = ClusterInit();
