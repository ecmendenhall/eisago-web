(ns eisago-web.handlers.namespace-spec
  (:require [speclj.core :refer :all]
            [ring.mock.request :refer :all]
            [eisago-web.handlers.namespace :refer :all]))

(defn mock-view [name]
  (fn [& args] {:view name :args args}))

(def req (request :get "/"))

(describe "Namespace handler"
          (it "returns a placeholder"
              (let [response (namespace-handler req)]
                (should= 200
                         (response :status))
                (should-contain "namespace"
                                (response :body)))))
