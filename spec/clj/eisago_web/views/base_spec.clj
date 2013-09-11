(ns eisago-web.views.base-spec
  (:require [speclj.core :refer :all]
            [eisago-web.views.base :refer :all]))

(def template-context {:title "Base template" :main "Main body"})

(describe "Base template"
          (it "renders with a title from the given context"
              (should-contain "Base template"
                              (base template-context)))

          (it "renders with body content from the given context"
              (should-contain "Main body"
                              (base template-context))))
