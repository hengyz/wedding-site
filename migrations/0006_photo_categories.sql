-- Replace removed travel category with certificate; remap legacy travel photos

UPDATE photos SET category = 'certificate' WHERE category = 'travel';
