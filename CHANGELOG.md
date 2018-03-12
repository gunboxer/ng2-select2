# 0.0.1

### New features added:

new properties:
* autoSelect:
Auto select on data provide now can be disabled
* entity:
     Entity based select. Entity classes should extend S2Option interface
* idProperty:
     Used to specify from which property of entity id should be retrived
* textProperty:
    Used to specify from which property of entity text should be retrived
* idGetter:
* textGetter:
    Custom functions could be provided to get id and text from entity

ngOnChanges replaced with more flexible setters.
build script reworked to support windows.

entity emittion fixed

cssimport property removed as well as css injection.