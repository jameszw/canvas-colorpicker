module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        src: 'src/',
        dest: 'build/',

        uglify: {
            options: {
                preserveComments: false,
                compress: {
                    drop_console: true
                }
            },

            build: {
                files: {
                    '<%= dest %><%= pkg.name %>.min.js': '<%= src %><%= pkg.name %>.js'
                }
            }
        },

        jshint: {
            options: {
                eqnull: true 
            },
            files: ['Gruntfile.js', '<%= src %>/**/*.js']
        },

        watch: {
            grunt: {
                files: ['Gruntfile.js']
            },

            js: {
                files: ['<%= jshint.files %>'],
                tasks: ['default']
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('default', ['jshint', 'uglify']);

};
