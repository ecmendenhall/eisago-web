(defproject eisago-web "0.1.0-SNAPSHOT"
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [enlive "1.1.4"]
                 [compojure "1.1.5"]
                 [domina "1.0.0"]
                 [eisago "0.1.1-SNAPSHOT"]]
  :plugins [[lein-ring "0.8.7"]
            [speclj "2.7.4"]
            [specljs "2.7.4"]
            [lein-cljsbuild "0.3.2"]]
  :ring {:handler eisago-web.core/app}
  :profiles
  {:dev {:dependencies [[ring-mock "0.1.5"]
                        [speclj "2.7.4"]
                        [specljs "2.7.4"]]}}
  :cljsbuild ~(let [run-specs ["phantomjs" "bin/specljs_runner.js" "resources/public/js/eisago_web_dev.js"]]
                {:builds {:dev {:source-paths ["src/cljs" "spec/cljs"]
                                :compiler {:output-to "resources/public/js/eisago_web_dev.js"
                                           :optimizations :whitespace
                                           :pretty-print true}
                                :notify-command run-specs}
                          :prod {:source-paths ["srs/cljs"]
                                 :compiler {:output-to "resources/public/js/eisago_web.js"
                                            :optimizations :simple}}}
                 :test-commands {"test" run-specs}})
  :source-paths ["src/clj" "src/cljs"]
  :test-paths ["spec/clj"])
