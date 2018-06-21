#!/usr/bin/groovy

// load pipeline functions
// Requires pipeline-github-lib plugin to load library from github

@Library('github.com/lachie83/jenkins-pipeline@dev')
def pipeline = new io.estrado.Pipeline()

podTemplate(label: 'jenkins-pipeline', containers: [
    containerTemplate(name: 'jnlp', image: 'lachlanevenson/jnlp-slave:3.10-1-alpine', args: '${computer.jnlpmac} ${computer.name}', workingDir: '/home/jenkins', resourceRequestCpu: '200m', resourceLimitCpu: '300m', resourceRequestMemory: '256Mi', resourceLimitMemory: '512Mi'),
    containerTemplate(name: 'docker', image: 'docker', command: 'cat', ttyEnabled: true),
    containerTemplate(name: 'golang', image: 'golang', command: 'cat', ttyEnabled: true),
    containerTemplate(name: 'helm', image: 'lachlanevenson/k8s-helm:v2.7.2', command: 'cat', ttyEnabled: true),
    containerTemplate(name: 'kubectl', image: 'lachlanevenson/k8s-kubectl:v1.9.2', command: 'cat', ttyEnabled: true)
],
volumes:[
    hostPathVolume(mountPath: '/var/run/docker.sock', hostPath: '/var/run/docker.sock'),
]){

  node ('jenkins-pipeline') {
    properties([disableConcurrentBuilds()])
    def pwd = pwd()

    checkout scm

    // read in required jenkins workflow config values
    def inputFile = readFile('Jenkinsfile.json')
    def config = new groovy.json.JsonSlurperClassic().parseText(inputFile)
    def chart_dir = "${pwd}/charts/${config.container_repo.repo}"
    println "pipeline config ==> ${config}"

    // continue only if pipeline enabled
    if (!config.pipeline.enabled) {
        println "pipeline disabled"
        return
    }

    // set additional git envvars for image tagging
    pipeline.gitEnvVars()

    switch (true) {
      case env.BRANCH_NAME =~ "PR-*":
      case env.BRANCH_NAME == "master":
      case env.BRANCH_NAME == "develop":
      case env.BRANCH_NAME == "acceptance":
        break
      default:
        return
    }

    // If pipeline debugging enabled
    if (config.pipeline.debug) {
      println "DEBUG ENABLED"
      sh "env | sort"

      println "Runing kubectl/helm tests"
      container('kubectl') {
        pipeline.kubectlTest()
      }
      container('helm') {
        pipeline.helmConfig()
      }
    }

    def acct = pipeline.getContainerRepoAcct(config)

    // tag image with version, and branch-commit_id
    def image_tags_map = pipeline.getContainerTags(config)

    // compile tag list
    def image_tags_list = pipeline.getMapValues(image_tags_map)

    stage ('publish container') {

      container('docker') {
        // build and publish container
        pipeline.containerBuildPub(
            dockerfile: config.container_repo.dockerfile,
            host      : config.container_repo.host,
            acct      : acct,
            repo      : config.container_repo.repo,
            tags      : image_tags_list,
            auth_id   : config.container_repo.jenkins_creds_id,
            image_scanning: config.container_repo.image_scanning
        )

        // anchore image scanning configuration
//        println "Add container image tags to anchore scanning list"

//        def tag = image_tags_list.get(0)
//        def imageLine = "${config.container_repo.host}/${acct}/${config.container_repo.repo}:${tag}" + ' ' + env.WORKSPACE + '/Dockerfile'
//        writeFile file: 'anchore_images', text: imageLine
//        anchore name: 'anchore_images', inputQueries: [[query: 'list-packages all'], [query: 'list-files all'], [query: 'cve-scan all'], [query: 'show-pkg-diffs base']]

      }

    }

    if (env.BRANCH_NAME =~ "PR-*" ) {
      stage ('deploy to k8s') {
        container('helm') {
          // Deploy using Helm chart
          pipeline.helmDeploy(
            dry_run       : false,
            name          : env.BRANCH_NAME.toLowerCase(),
            namespace     : env.BRANCH_NAME.toLowerCase(),
            chart_dir     : chart_dir,
            set           : [
              "imageTag": image_tags_list.get(0),
              "replicas": config.app.replicas,
              "cpu": config.app.cpu,
              "memory": config.app.memory,
              "ingress.hostname": config.app.hostname,
            ]
          )

          //  Run helm tests
          if (config.app.test) {
            pipeline.helmTest(
              name        : env.BRANCH_NAME.toLowerCase()
            )
          }

          // delete test deployment
          pipeline.helmDelete(
              name       : env.BRANCH_NAME.toLowerCase()
          )
        }
      }
    }

    if (env.BRANCH_NAME == 'acceptance') {
      stage ('deploy to k8s') {
        container('helm') {
          // Deploy using Helm chart
          pipeline.helmDeploy(
            dry_run       : false,
            name          : env.BRANCH_NAME.toLowerCase(),
            namespace     : env.BRANCH_NAME.toLowerCase(),
            chart_dir     : chart_dir,
            set           : [
              "imageTag": image_tags_list.get(0),
              "replicas": config.app.replicas,
              "cpu": config.app.cpu,
              "memory": config.app.memory,
              "ingress.hostname": "acceptance." + config.app.hostname,
            ]
          )

          //  Run helm tests
          if (config.app.test) {
            pipeline.helmTest(
              name        : env.BRANCH_NAME.toLowerCase()
            )
          }
        }
      }
    }

    if (env.BRANCH_NAME == 'develop') {
      stage ('deploy to k8s') {
        container('helm') {
          // Deploy using Helm chart
          pipeline.helmDeploy(
            dry_run       : false,
            name          : env.BRANCH_NAME.toLowerCase(),
            namespace     : env.BRANCH_NAME.toLowerCase(),
            chart_dir     : chart_dir,
            set           : [
              "imageTag": image_tags_list.get(0),
              "replicas": config.app.replicas,
              "cpu": config.app.cpu,
              "memory": config.app.memory,
              "ingress.hostname": "dev." + config.app.hostname,
            ]
          )

          //  Run helm tests
          if (config.app.test) {
            pipeline.helmTest(
              name        : env.BRANCH_NAME.toLowerCase()
            )
          }
        }
      }
    }

    // deploy only the master branch
    if (env.BRANCH_NAME == 'master') {
      stage ('deploy to k8s') {
        container('helm') {
	      def _tag = image_tags_list.get(0)
          // Deploy using Helm chart
          pipeline.helmDeploy(
            dry_run       : false,
            name          : config.app.name,
            namespace     : config.app.name,
            chart_dir     : chart_dir,
            set           : [
              "imageTag": "${_tag}",
              "replicas": config.app.replicas,
              "cpu": config.app.cpu,
              "memory": config.app.memory,
              "ingress.hostname": config.app.hostname,
            ]
          )

          //  Run helm tests
          if (config.app.test) {
            pipeline.helmTest(
              name          : config.app.name
            )
          }
        }
      }
    }
  }
}
