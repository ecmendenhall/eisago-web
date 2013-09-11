(ns eisago-web.handlers.var-spec
  (:require [speclj.core :refer :all]
            [ring.mock.request :refer :all]
            [eisago-web.handlers.var :refer :all]))

(defn mock-view [name]
  (fn [& args] {:view name :args args}))

(defn mock-doc-for [_ project version namespace var]
  {:response 200
   :body (str {:project project :version version :ns namespace :name var})})

(defn mock-search [_]
  {:response 200 :body (str {:hits [{:lib-version "1.0.1"}
                                    {:lib-version "1.4.0"}
                                    {:lib-version "0.0.1-SNAPSHOT"}
                                    {:lib-version "1.5.1"}]})})

(def req (request :get "/clojure/1.5.1/clojure.org/map"))

(describe "Determining latest version"
          (it "returns the latest version for a given name ns and var"
              (should= "1.5.1"
                       (with-redefs [eisago.api.edn/search
                                     mock-search]
                         (latest-version "clojure" "clojure.core" "map")))))

(describe "Var handler"
          (it "passes the correct context to the view"
              (let [response (with-redefs [eisago.api.edn/doc-for
                                           mock-doc-for

                                           eisago-web.views.var/var-view
                                           (mock-view "var")]
                               (show "clojure" "1.5.1" "clojure.core" "map"))
                    context (first (response :args))]
                (should=  "var" (response :view))
                (should= {:project "clojure"
                          :version "1.5.1"
                          :ns "clojure.core"
                          :name "map"}
                         context))))
