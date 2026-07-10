Pod::Spec.new do |s|
  s.name           = 'FabricViewRecyclingFix'
  s.version        = '1.0.0'
  s.summary        = 'Disables Fabric component-view recycling on iOS (workaround)'
  s.description    = <<-DESC
    ObjC category on RCTViewComponentView returning shouldBeRecycled = NO, so
    Fabric never pools/reuses component views across mounts. Works around the
    react-native-screens + Fabric recycle corruption that leaves an orphaned,
    touch-swallowing plain view on a re-pushed screen.
  DESC
  s.author         = 'Jean Desauw'
  s.homepage       = 'https://github.com/JeanDes-Code/rn-fabric-recycling-touch-dead-repro'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { :path => '.' }
  s.source_files   = '**/*.{h,m,mm}'

  install_modules_dependencies(s)
end
