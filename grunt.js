module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    lint: {
      all: ['*.js', 'lib/**/*.js', 'example/*.js', 'test/**/*.js']
    },

    jshint: {
      options: {
        curly: true,
        es5: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        laxcomma: true,
        newcap: false,
        noarg: true,
        sub: true,
        undef: true,
        eqnull: true,
        browser: false
      },
      globals: {
        module: true,
        require:true,
        exports:true,
        console:true,
        __dirname:true,
        process:true,
        setTimeout:true,
        clearTimeout:true
      }
    },

    watch: {
      files: ['<config:lint.all>'],
      tasks: 'lint test'
    },

    test: {
      all: ['test/**/*.js']
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint qunit concat min');
};
