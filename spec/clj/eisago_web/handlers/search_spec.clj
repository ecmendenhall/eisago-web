(ns eisago-web.handlers.search-spec
  (:require [speclj.core :refer :all]
            [ring.mock.request :refer :all]
            [eisago-web.handlers.search :refer :all]))

(defn mock-view [name]
  (fn [& args] {:view name :args args}))

(def hit {:project "org.clojure/clojure"
          :ns "clojure.core"
          :library "clojure"
          :name "map"
          :doc "docstring"
          :id "thisisalongfakeid"
          :score 0.12345})

(defn make-hit [version]
  (assoc hit :lib-version version))

(defn mock-search [_]
  {:response 200
   :body (str {:hits (mapv make-hit ["1.5.1" "1.0.0" "1.4.0"])})})

(def req (request :get "/search?q=map"))

(describe "Processing search results"
          (it "extracts a project's name information from search hits"
              (should= {:project "org.clojure/clojure"
                        :ns "clojure.core"
                        :library "clojure"
                        :name "map"}
                       (extract-full-name hit)))

          (it "averages the scores of hits with the same name info"
              (should= 5.0
                       (average-score {:details [{:score 10}
                                                 {:score 0}]})))

          (it "bundles hits with the same name information"
              (should= 1
                       (count (bundle-hits (map make-hit ["1.5.1" "1.0.0" "1.4.0"]))))))

(describe "Search handler"
          (it "passes the correct context to the search view"
              (let [response (with-redefs [eisago.api.edn/search
                                           mock-search

                                           eisago-web.views.search/search-view
                                           (mock-view "search")]
                               (show req))
                    context (first (response :args))]
                (should= "search"
                         (response :view))
                (should= 1
                         (count (context :hits)))
                (should= (map make-hit ["1.5.1" "1.0.0" "1.4.0"])
                         ((first (context :hits)) :details)))))
