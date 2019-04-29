<template>
  <div>
    <el-container class="container">

      <el-header height="140px">
        <h3>Github Repo URL</h3>

        <div class="repo-right">
          <el-button style="width: 100%" type="info" @click="startAnalysis" plain><i :class="beginStatusClass"></i>Begin Anlysis</el-button>
        </div>
        <div class="repo-left">
          <el-input autofocus v-model="repoURL" @keyup.enter.native="startAnalysis" :placeholder="defaultURL"></el-input>
        </div>

      </el-header>

      <el-main v-if="data.length !== 0">
        <div class="common-info-container" v-if="totalDownloads">
          <!-- top total downloads -->
          <el-alert
            :closable="false"
            type="success"
            id="top-total"
            >
            <i class="el-icon-download">Total Downloads: <b>{{totalDownloads}}</b></i>
          </el-alert>

          <el-button size="mini" type="info" plain @click="toggleChart">Toggle Chart Type</el-button>
          <ve-chart :data="chartData" :settings="chartSettings"></ve-chart>

          <!-- release downloads -->
          <el-card>
            <el-table v-if="downloadsByReleases.length != 0"
              :data="downloadsByReleases"
              show-summary
              sum-text="Total Downloads"
              max-height="300"
              >
              <el-table-column
                prop="name"
                label="Release"
                >
                  <template slot-scope="scope">
                    <i class="el-icon-goods"></i>
                    <a style="margin-left: 10px">{{ scope.row.tag }}</a>
                  </template>
              </el-table-column>
              <el-table-column
                sortable
                prop="count"
                label="Download"
                >
              </el-table-column>
              <el-table-column
                sortable
                prop="percent"
                label="Percent %"
                :sort-method="sortBy"
                >
              </el-table-column>
            </el-table>
          </el-card>
        </div>

        <!-- release cards -->
        <el-card v-for="release in data" class="release-cards">
          <div slot="header" class="clearfix">
            <span class="el-icon-star-on release-card-tag-name">{{ release.tag_name}}</span>
            <a :href="release.html_url">{{ release.name}}</a>
            <span class="release-card-right el-icon-time"> {{ new Date(release.published_at).toLocaleDateString() }} by <a :href="'https://github.com/' + release.author.login">{{ release.author.login }}</a></span>
          </div>

          <div>
            <el-table v-if="release.assets && release.assets.length != 0"
              :data="release.assets"
              :show-summary="release.assets.length > 1"
              sum-text="Total Downloads"
              >
              <el-table-column
                prop="name"
                label="Assets"
                >
                  <template slot-scope="scope">
                    <i class="el-icon-sold-out"></i>
                    <a :href="scope.row.browser_download_url" style="margin-left: 10px">{{ scope.row.name }}</a>
                  </template>
              </el-table-column>
              <el-table-column
                prop="download_count"
                label="Download"
                >
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-main>
    </el-container>

    <div class="copyright-declare">Powered by <a href="https://qii404.me">qii404.me</a></div>
  </div>
</template>

<script type="text/javascript">
  import gh from 'parse-github-url';

  export default {
    data() {
      return {
        repoURL: '',
        data: [],
        beginStatusClass: '',
        defaultURL: 'https://github.com/qishibo/AnotherRedisDesktopManager/',
        chartIndex: 0,
        pieRoseType: 'radius',
        chartToggles: ['histogram', 'pie', 'pie'],
      };
    },
    computed: {
      chartSettings() {
        const settings = {type: this.chartToggles[this.chartIndex], roseType: this.pieRoseType};

        if (settings.type === 'pie') {
          this.pieRoseType = this.pieRoseType ? '' : 'radius';
        }

        return settings;
      },
      totalDownloads() {
        let count = 0;

        for (const release of this.data) {
          for (const asset of release.assets) {
            count += asset.download_count;
          }
        }

        return count;
      },
      chartData() {
        return {
          columns: ['tag', 'count'],
          rows: this.downloadsByReleases,
        }
      },
      downloadsByReleases() {
        let download = [];
        const total = this.totalDownloads;

        for (const release of this.data) {
          let releaseDownload = {tag: release.tag_name, count: 0};

          for (const asset of release.assets) {
            releaseDownload.count += asset.download_count;
          }

          releaseDownload.percent = ((releaseDownload.count / total).toFixed(4) * 100).toFixed(2);
          download.push(releaseDownload);
        }

        return download;
      },
    },
    methods: {
      startAnalysis() {
        this.beginStatusClass = 'el-icon-loading';
        !this.repoURL && (this.repoURL = this.defaultURL);

        let url = this.repoURL;

        if (url.substr(0, 4) !== 'http') {
          url = 'https://' + url;
        }

        let info = gh(url);

        if (!info || !info.owner || !info.name) {
          this.$message.error('URL error!');
          this.data = [];
          this.beginStatusClass = '';

          return false;
        }

        let releaseURL = `https://api.github.com/repos/${info.owner}/${info.name}/releases?ran=` + Math.random();

        this.$http.get(releaseURL).then(response => {
          console.log(response);

          this.data = response.body;
          this.beginStatusClass = '';
        }).catch(response => {
          console.log('error', response);
          this.$message.error('Request Failed, Msg: ' + response.statusText);

          this.data = [];
          this.beginStatusClass = '';
        });
      },
      toggleChart() {
        this.chartIndex += 1;
        (this.chartIndex >= this.chartToggles.length) && (this.chartIndex = 0);
      },
      sortBy(a, b) {
        return a.percent - b.percent;
      },
    },
  };
</script>

<style type="text/css">
  body a {
    color: #263238;
  }
  .container{
    max-width: 900px;
    margin: 10px auto;
  }
  .container .el-header, .container .el-main {
    padding: 12px;
  }
  .repo-right {
    float: right;
    width: 125px;
  }
  .repo-left {
    margin-right: 130px;
  }
  .common-info-container{
    margin-bottom: 20px;
  }
  #top-total {
    margin-bottom: 10px;
  }
  .release-cards{
    margin-bottom: 15px;
  }
  .release-card-tag-name {
    margin-right: 8px;
  }
  .release-card-right {
    float: right;
    font-size: 80%;
    /*line-height: 19px;*/
    color: grey;
    margin-top: 5px;
  }
  .copyright-declare{
    position: fixed;;
    bottom: 5px;
    left: 10px;
    font-size: 50%;
    color: grey;
  }
  .copyright-declare a {
    color: grey;
  }
</style>
