(ns eisago-web.handlers.project-spec
  (:require [speclj.core :refer :all]
            [ring.mock.request :refer :all]
            [eisago-web.handlers.project :refer :all]))

(defn mock-view [name]
  (fn [& args] {:view name :args args}))

(def req (request :get "/"))

(describe "Project handler"
          (it "returns a placeholder"
              (let [response (project-handler req)]
                (should= 200
                         (response :status))
                (should-contain "project"
                                (response :body)))))
