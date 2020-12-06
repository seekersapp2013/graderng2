<script>
  import { onMount } from "svelte";
  import AvatarBall from "../components/tracker-ball/ball.svelte";
  import ButtonGroup from "../components/button-group/button-group.svelte";
  import Dymoji from "../components/dymoji/dymoji.svelte";
  import ItemBall from "../components/tracker-ball/item-ball.svelte";
  import NItem from "../components/list-item/list-item.svelte";
  import NToolbar from "../components/toolbar/toolbar.svelte";
  import NIcon from "../components/icon/icon.svelte";
  import PersonBall from "../components/tracker-ball/person-ball.svelte";
  import NSearchBar from "../components/search-bar/search-bar.svelte";
  import NLayout from "../containers/layout/layout.svelte";
  import NTip from "../components/tip/tip.svelte";

  import tick from "../utils/tick/tick";
  import dayjs from "dayjs";

  import Person from "../modules/person/person";

  import { Lang } from "../store/lang";
  import { ClusterStore } from "../store/Cluster-store";
  import { Interact } from "../store/interact";
  import { LedgerStore } from "../store/ledger";
  import Text from "../components/text/text.svelte";
  import Button from "../components/button/button.svelte";

  export let location;

  let state = {
    Cluster: [],
    view: "time",
    stats: {},
    searchTerm: null,
    initialized: false,
  };

  const personClicked = (username) => {
    Interact.person(username);
  };

  /**
   * When ClusterStore Changes,
   * set state.Cluster to the array of usernames
   */
  $: if (state.view && $ClusterStore.Cluster) {
    loadCluster();
    state.initialized = true;
  }

  function loadCluster() {
    const longTimeAgo = dayjs().subtract(100, "years").toDate();

    state.Cluster = getCluster().sort((a, b) => {
      return $ClusterStore.Cluster[a].last < $ClusterStore.Cluster[b].last ? 1 : -1;
    });
  }

  function searchCluster(evt) {
    if (evt.detail) {
      state.searchTerm = evt.detail.toLowerCase();
    } else {
      state.searchTerm = null;
    }
  }

  function clearSearch() {
    state.searchTerm = null;
  }

  async function addPerson() {
    try {
      let username = await Interact.prompt(Lang.t("Cluster.person-name", "Person Name"));
      if (username) {
        let person = await ClusterStore.addByName(username);
        if (person) {
          LedgerStore.fastLog(`Added @${person.username} to +nomie`);
          personClicked(person.username);
        }
      }
    } catch (e) {
      Interact.alert("Error", e.message);
    }
  }

  function getCluster() {
    // The $ClusterStore.peple is a map - username is the key
    if (state.searchTerm) {
      return Object.keys(($ClusterStore || {}).Cluster || {}).filter((person) => {
        return person.toLowerCase().search(state.searchTerm) > -1;
      });
    } else {
      return Object.keys(($ClusterStore || {}).Cluster || {});
    }
  }

  onMount(() => {
    loadCluster();
    state.initialized = true;
  });
</script>

<style lang="scss">

</style>

<NLayout pageTitle="Cluster">
  <div slot="header">
    <div class="container px-2" style="margin-top:2px;">
      <NSearchBar compact on:change={searchCluster} on:clear={clearSearch} placeholder="Search Cluster..." autocomplete>
        <button on:click={addPerson} slot="right" class="btn btn-icon btn-clear">
          <NIcon name="userAdd" className="fill-primary-bright" />
        </button>
      </NSearchBar>
    </div>
  </div>

  <div slot="content" class="container">
    <div class="n-list my-2 bg-transparent">
      {#if !state.Cluster.length && !state.searchTerm && state.initialized}
        <NItem className="mt-5 py-3" bg="transparent">
          <div class="text-md text-center">
            Track & monitor how you interact
            <br />
            with your friends and family.
          </div>
          <div class="text-sm mt-2 text-center">
            <span class="fake-link" on:click={addPerson}>Add a person</span>
            or
            <span class="fake-link" on:click={ClusterStore.searchForCluster}>Find recent @Cluster</span>
          </div>

        </NItem>
      {:else if !state.initialized}
        <NItem>Loading...</NItem>
      {:else if !state.Cluster.length && state.searchTerm}
        <NItem>Nothing found for @{state.searchTerm}</NItem>
      {/if}

      {#each state.Cluster as person}
        <NItem bottomLine truncate clickable={false} className="py-3">
          <div slot="left">
            {#if $ClusterStore.Cluster[person] && $ClusterStore.Cluster[person].avatar}
              <AvatarBall size={48} avatar={$ClusterStore.Cluster[person].avatar} style={`border-radius:32%; overflow:hidden`} />
            {:else if $ClusterStore.Cluster[person] && $ClusterStore.Cluster[person].displayName}
              <AvatarBall size={48} username={$ClusterStore.Cluster[person].displayName} style={`border-radius:32%; overflow:hidden`} />
            {/if}
          </div>

          <div class="n-row truncate-1">
            <Button
              color="clear"
              size="xs"
              inline
              style="max-width:30px; width:24px;"
              className="p-0 mr-2"
              on:click={(evt) => {
                Interact.openStats(`@${person}`);
              }}>
              <NIcon name="chart" className="fill-primary-bright" size={18} />
            </Button>
            <Text size="md" lineHeightMd truncate className="filler">{($ClusterStore.Cluster[person] || {}).displayName}</Text>
          </div>

          {#if $ClusterStore.Cluster[person] && $ClusterStore.Cluster[person].last}
            <Text size="sm" faded>{dayjs($ClusterStore.Cluster[person].last).fromNow()}</Text>
          {/if}
          <div slot="right" class="n-row">

            <Button
              color="clear"
              className=""
              on:click={(evt) => {
                personClicked(person);
              }}>
              <Text size="xs" bold className="text-primary-bright text-uppercase">{Lang.t('Cluster.check-in', 'Check-in')}</Text>
            </Button>

          </div>
        </NItem>
      {/each}

    </div>
  </div>
</NLayout>
