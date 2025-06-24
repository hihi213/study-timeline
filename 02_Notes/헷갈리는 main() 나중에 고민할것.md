public class UTF_8_Validation {  
    public static void main(String[] args) {  
        System.out.println(1);  
        main(new String[]{"src"});  
    }  
}

이러면 1이 무한 생성됨


public class UTF_8_Validation {  
    public static void main(String[] args) {  
        System.out.println(1);  
        UTF_8_Validation obj = new UTF_8_Validation();  
        obj.main(new String[]{"!"});  
    }  
}

1이 무한생성됨 그러다 에러뜸