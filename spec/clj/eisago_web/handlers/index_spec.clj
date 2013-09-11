(ns eisago-web.handlers.index-spec
  (:require [speclj.core :refer :all]
            [ring.mock.request :refer :all]
            [eisago-web.handlers.index :refer :all]))

(defn mock-view [name]
  (fn [& args] {:view name :args args}))

(def req (request :get "/"))

(describe "Index handler"
          (it "calls the index view"
              (with-redefs [eisago-web.views.index/index-view
                            (mock-view "index")]
                (should= show
                         (index-handler req))
                (should= "index"
                         ((show req) :view)))))
