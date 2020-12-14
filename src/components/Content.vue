<template>
  <div>
    <el-container class="container">

      <el-header height="140px">
        <h3>Github Repo URL</h3>

        <div class="repo-right">
          <el-button style="width: 100%" type="info" @click="startAnalysis" plain><i :class="beginStatusClass"></i>开始分析</el-button>
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
            <i class="el-icon-download">总下载量: <b>{{totalDownloads}}</b></i>
          </el-alert>

          <el-button size="mini" type="info" plain @click="toggleChart">改变图表类型</el-button>
          <el-button size="mini" type="info" plain @click="setPatternDialog = true">排除资源文件<span style="color: red;">{{ filterPattern }}</span></el-button>
          <ve-chart :legend-visible="legendVisible" :data="chartData" :settings="chartSettings"></ve-chart>

          <!-- release downloads -->
          <el-card>
            <el-table v-if="downloadsByReleases.length != 0"
              :data="downloadsByReleases"
              show-summary
              sum-text="总下载量"
              max-height="300"
              >
              <el-table-column
                prop="name"
                label="发布版本号"
                >
                  <template slot-scope="scope">
                    <i class="el-icon-goods"></i>
                    <a style="margin-left: 10px">{{ scope.row.tag }}</a>
                  </template>
              </el-table-column>
              <el-table-column
                sortable
                prop="count"
                label="下载量"
                >
              </el-table-column>
              <el-table-column
                sortable
                prop="percent"
                label="占比 %"
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
                label="资源文件"
                >
                  <template slot-scope="scope">
                    <i class="el-icon-sold-out"></i>
                    <a :href="scope.row.browser_download_url" style="margin-left: 10px">{{ scope.row.name }}</a>
                  </template>
              </el-table-column>
              <el-table-column
                prop="download_count"
                label="下载量"
                >
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-main>
    </el-container>

    <!-- set pattern dialog -->
    <el-dialog
      title="设置要排除的资源文件"
      :visible.sync="setPatternDialog"
      append-to-body>

      <p>要排除的文件类型, 例如  "yml" 或 "*yml*"</p>
      <el-input v-model="filterPattern" @keyup.enter.native="setFilePattern" />

      <div slot="footer" class="dialog-footer">
        <el-button @click="setFilePattern">设置</el-button>
      </div>
    </el-dialog>

    
    <div class="copyright-declare">本项目原作者是<a href="https://github.com/qishibo/github-release-statistics">qishibo</a> 当前镜像汉化：<a href="http://ringotek.cn">灵高信息技术</a></div>
  
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
        defaultURL: 'https://github.com/fslongjin/Cpp-Asciify',
        chartIndex: 0,
        pieRoseType: 'radius',
        chartToggles: ['histogram', 'pie', 'pie'],
        legendVisible: false,
        filterPattern: '',
        setPatternDialog: false,
      };
    },
    computed: {
      chartSettings() {
        const settings = {type: this.chartToggles[this.chartIndex], roseType: this.pieRoseType};

        if (settings.type === 'pie') {
          this.pieRoseType = this.pieRoseType ? '' : 'radius';
          this.legendVisible = true;
        }
        else {
          this.legendVisible = false;
        }

        return settings;
      },
      totalDownloads() {
        let count = 0;

        for (const releaseData of this.downloadsByReleases) {
          count += releaseData.count;
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
        let total = 0;

        for (const release of this.data) {
          let releaseDownload = {tag: release.tag_name, count: 0};

          for (const asset of release.assets) {
            if (!asset) {
              continue;
            }

            releaseDownload.count += asset.download_count;
            total += asset.download_count;
          }

          download.push(releaseDownload);
        }

        for (const releaseData of download) {
          releaseData.percent = ((releaseData.count / total).toFixed(4) * 100).toFixed(2);
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

          // this.data = response.body;
          this.data = this.filterFile(response.body);
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
      filterFile(data) {
        const pattern = this.getfilterPattern();

        if (!pattern) {
          return data;
        }

        for (const release of data) {
          for (var assetIndex = 0; assetIndex < release.assets.length; assetIndex++) {
            if (release.assets[assetIndex].name.match(pattern)) {
              delete release.assets[assetIndex];
            }
          }
        }

        return data;
      },
      getfilterPattern() {
        let pattern = this.filterPattern;

        if (!pattern) {
          return false;
        }

        pattern = pattern.replace(/\*/g, '.*');
        return new RegExp(pattern);
      },
      setFilePattern() {
        this.setPatternDialog = false;
        this.startAnalysis();
      },
    },
    mounted() {
      const repo = (new URL(window.location.href)).searchParams.get('repo');

      if (!repo) {
        return true;
      }

      this.repoURL = repo;
      this.startAnalysis();
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
