var fs = require('fs');
module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-shell');

  var jshintFile = fs.readFileSync(__dirname + '/.jshintrc').toString('utf8');
  var jshintConf = JSON.parse(jshintFile);

  // Project configuration.
  grunt.initConfig({
    lint: {
      all: ['*.js', 'lib/**/*.js', 'example/*.js', 'test/**/*.js']
    },

    jshint: jshintConf,

    watch: {
      files: ['<config:lint.all>'],
      tasks: 'lint shell:test'
    },

    shell: {
      test:{//--reporter minimal
        command: './node_modules/nodeunit/bin/nodeunit test/*.js',
        stdout: true,
        stderr: true,
        failOnError:true,
        warnOnError: true
      }
    }
  });

  grunt.registerTask('test', 'shell:test');
};
