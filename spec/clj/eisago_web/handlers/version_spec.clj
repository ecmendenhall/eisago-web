(ns eisago-web.handlers.version-spec
  (:require [speclj.core :refer :all]
            [ring.mock.request :refer :all]
            [eisago-web.handlers.version :refer :all]))

(defn mock-view [name]
  (fn [& args] {:view name :args args}))

(def req (request :get "/"))

(describe "Version handler"
          (it "returns a placeholder"
              (let [response (version-handler req)]
                (should= 200
                         (response :status))
                (should-contain "version"
                                (response :body)))))
